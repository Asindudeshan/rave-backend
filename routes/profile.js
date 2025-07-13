const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/profiles"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Always use req.params.id if available, fallback to req.user.id
    const userId = req.params && req.params.id ? req.params.id : req.user.id;
    cb(null, userId + ext);
  },
});
const upload = multer({ storage });

// Upload profile picture
router.post(
  "/:id/upload-profile-pic",
  authenticateToken,
  upload.single("profile_pic"),
  async (req, res) => {
    const db = req.app.locals.db;
    try {
      const fs = require("fs");
      const userId = req.params.id;
      console.log("User ID:", userId);
      // Get old profile_pic path
      const [users] = await db
        .promise()
        .query("SELECT profile_pic FROM users WHERE id = ?", [userId]);
      if (users.length > 0 && users[0].profile_pic) {
        const oldPic = users[0].profile_pic;
        const oldPicPath = path.join(__dirname, "../public", oldPic);
        // Only delete if the old file is not the same as the new file
        if (
          fs.existsSync(oldPicPath) &&
          oldPic !==
            `/images/profiles/${userId}${path.extname(req.file.originalname)}`
        ) {
          fs.unlinkSync(oldPicPath);
        }
      }
      // Always set the file name as userId + ext
      const ext = path.extname(req.file.originalname);
      const filePath = `/images/profiles/${userId}${ext}`;
      await db
        .promise()
        .query("UPDATE users SET profile_pic = ? WHERE id = ?", [
          filePath,
          userId,
        ]);
      res.json({ success: true, profile_pic: filePath });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: "Failed to upload profile picture" });
    }
  }
);

// Get user profile
router.get("/:id", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT id, name, email, phone, created_at, profile_pic FROM users WHERE id = ?",
        [req.params.id]
      );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put("/:id", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const { name, email, phone } = req.body;

    await db
      .promise()
      .query(
        "UPDATE users SET name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?",
        [name, email, phone, req.params.id]
      );

    const [users] = await db
      .promise()
      .query("SELECT id, name, email, phone, role FROM users WHERE id = ?", [
        req.params.id,
      ]);

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get("/:id/orders", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [orders] = await db.promise().query(
      `
      SELECT o.*, a.name, a.address_line, a.city 
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `,
      [req.params.id]
    );

    // Get order items for each order
    for (let order of orders) {
      const [items] = await db.promise().query(
        `
        SELECT oi.*, p.name, p.price, p.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.put(
  "/:id/orders/:orderId/cancel",
  authenticateToken,
  async (req, res) => {
    const db = req.app.locals.db;

    try {
      const [orders] = await db
        .promise()
        .query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [
          req.params.orderId,
          req.params.id,
        ]);

      if (orders.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = orders[0];
      if (order.status === "shipped" || order.status === "delivered") {
        return res
          .status(400)
          .json({ message: "Cannot cancel shipped or delivered orders" });
      }

      await db
        .promise()
        .query(
          "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
          ["cancelled", req.params.orderId]
        );

      res.json({ message: "Order cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get user reviews
router.get("/:id/reviews", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [reviews] = await db.promise().query(
      `
      SELECT r.*, p.name as product_name, p.image
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `,
      [req.params.id]
    );

    res.json(reviews || []);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add review
router.post("/:id/reviews", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const { product_id, order_id, rating, comment } = req.body;

    // Check if order belongs to user and is delivered
    const [orders] = await db
      .promise()
      .query(
        "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?",
        [order_id, req.params.id, "delivered"]
      );

    if (orders.length === 0) {
      return res
        .status(400)
        .json({ message: "Can only review products from delivered orders" });
    }

    // Check if product was in the order
    const [orderItems] = await db
      .promise()
      .query(
        "SELECT * FROM order_items WHERE order_id = ? AND product_id = ?",
        [order_id, product_id]
      );

    if (orderItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Product not found in this order" });
    }

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
        [req.params.id, product_id, order_id, rating, comment]
      );

    const [newReview] = await db.promise().query(
      `
      SELECT r.*, p.name as product_name, p.image
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `,
      [result.insertId]
    );

    res.status(201).json(newReview[0]);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
