const express = require("express");
const {
  authenticateToken,
  requireEmployeeOrAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Create order
router.post("/", authenticateToken, async (req, res) => {
  const { items, address_id, notes } = req.body;
  const db = req.app.locals.db;

  try {
    // Validate address belongs to user
    const [addresses] = await db
      .promise()
      .query("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [
        address_id,
        req.user.userId,
      ]);

    if (addresses.length === 0) {
      return res.status(400).json({ message: "Invalid address" });
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of items) {
      const [products] = await db
        .promise()
        .query("SELECT price FROM products WHERE id = ?", [item.product_id]);
      if (products.length > 0) {
        totalPrice += products[0].price * item.quantity;
      }
    }

    // Create order
    const [orderResult] = await db
      .promise()
      .query(
        "INSERT INTO orders (user_id, total_price, address_id, notes) VALUES (?, ?, ?, ?)",
        [req.user.userId, totalPrice, address_id, notes]
      );

    const orderId = orderResult.insertId;

    // Add order items
    for (const item of items) {
      const [products] = await db
        .promise()
        .query("SELECT price FROM products WHERE id = ?", [item.product_id]);
      if (products.length > 0) {
        await db
          .promise()
          .query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [orderId, item.product_id, item.quantity, products[0].price]
          );

        // Update stock
        await db
          .promise()
          .query("UPDATE products SET stock = stock - ? WHERE id = ?", [
            item.quantity,
            item.product_id,
          ]);
      }
    }

    res.status(201).json({ message: "Order created successfully", orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get order by ID with details
router.get("/:id", authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const db = req.app.locals.db;

  try {
    // Get order details
    const [orders] = await db.promise().query(
      `
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             a.label as address_label, a.name as recipient_name, 
             a.address_line, a.city, a.postal_code, a.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.id = ?
    `,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get order items with product details
    const [orderItems] = await db.promise().query(
      `
      SELECT oi.*, p.name as product_name, p.image, p.brand_id, b.name as brand_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE oi.order_id = ?
    `,
      [orderId]
    );

    const orderDetails = {
      ...orders[0],
      items: orderItems,
    };

    res.json(orderDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all orders (Admin and Employee only)
router.get("/", authenticateToken, requireEmployeeOrAdmin, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [orders] = await db.promise().query(`
        SELECT o.*, u.name as customer_name, u.email as customer_email,
               a.label as address_label, a.name as recipient_name, 
               a.address_line, a.city, a.postal_code, a.phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN addresses a ON o.address_id = a.id
        ORDER BY o.created_at DESC
      `);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user orders
router.get("/my-orders", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [orders] = await db.promise().query(
      `SELECT o.*, a.label as address_label, a.name as recipient_name, 
                a.address_line, a.city, a.postal_code, a.phone
         FROM orders o
         LEFT JOIN addresses a ON o.address_id = a.id
         WHERE o.user_id = ? 
         ORDER BY o.created_at DESC`,
      [req.user.userId]
    );

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status (Admin only)
router.put("/:id/status", authenticateToken, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  const db = req.app.locals.db;

  try {
    // Validate status
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update order status
    const [result] = await db
      .promise()
      .query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create POS order
router.post(
  "/pos",
  authenticateToken,
  requireEmployeeOrAdmin,
  async (req, res) => {
    const { items, customer_id, customer_phone } = req.body;
    const db = req.app.locals.db;
    const employeeId = req.user.userId;

    try {
      // Calculate total price and validate products
      let totalPrice = 0;
      for (const item of items) {
        const [products] = await db
          .promise()
          .query("SELECT price, stock FROM products WHERE id = ?", [
            item.product_id,
          ]);

        if (products.length === 0) {
          return res
            .status(400)
            .json({ message: `Product ${item.product_id} not found` });
        }

        if (products[0].stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for product ${item.product_id}. Available: ${products[0].stock}, Requested: ${item.quantity}`,
          });
        }

        totalPrice += products[0].price * item.quantity;
      }

      // Create POS order
      const [orderResult] = await db
        .promise()
        .query(
          "INSERT INTO orders (user_id, total_price, order_type, employee_id, status, notes) VALUES (?, ?, ?, ?, ?, ?)",
          [
            customer_id || null,
            totalPrice,
            "pos",
            employeeId,
            "delivered",
            customer_phone ? `Customer Phone: ${customer_phone}` : null,
          ]
        );

      const orderId = orderResult.insertId;

      // Add order items and update stock
      for (const item of items) {
        const [products] = await db
          .promise()
          .query("SELECT price FROM products WHERE id = ?", [item.product_id]);

        await db
          .promise()
          .query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [orderId, item.product_id, item.quantity, products[0].price]
          );

        // Update stock
        await db
          .promise()
          .query("UPDATE products SET stock = stock - ? WHERE id = ?", [
            item.quantity,
            item.product_id,
          ]);
      }

      res.status(201).json({
        message: "POS sale completed successfully",
        orderId,
        totalPrice: totalPrice.toFixed(2),
        customer: customer_id ? "Registered Customer" : "Walk-in Customer",
      });
    } catch (error) {
      console.error("POS order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get employee order statistics
router.get(
  "/employee/stats",
  authenticateToken,
  requireEmployeeOrAdmin,
  async (req, res) => {
    const db = req.app.locals.db;
    const employeeId = req.user.userId;

    try {
      // Get total orders processed by employee
      const [totalOrders] = await db
        .promise()
        .query(
          "SELECT COUNT(*) as total_orders FROM orders WHERE employee_id = ?",
          [employeeId]
        );

      // Get total sales by employee
      const [totalSales] = await db
        .promise()
        .query(
          "SELECT SUM(total_price) as total_sales FROM orders WHERE employee_id = ?",
          [employeeId]
        );

      // Get today's orders
      const [todayOrders] = await db
        .promise()
        .query(
          "SELECT COUNT(*) as today_orders FROM orders WHERE employee_id = ? AND DATE(created_at) = CURDATE()",
          [employeeId]
        );

      // Get today's sales
      const [todaySales] = await db
        .promise()
        .query(
          "SELECT SUM(total_price) as today_sales FROM orders WHERE employee_id = ? AND DATE(created_at) = CURDATE()",
          [employeeId]
        );

      // Get monthly stats
      const [monthlyStats] = await db.promise().query(
        `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orders_count,
        SUM(total_price) as total_sales
       FROM orders 
       WHERE employee_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC`,
        [employeeId]
      );

      res.json({
        totalOrders: totalOrders[0].total_orders || 0,
        totalSales: totalSales[0].total_sales || 0,
        todayOrders: todayOrders[0].today_orders || 0,
        todaySales: todaySales[0].today_sales || 0,
        monthlyStats: monthlyStats,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get employee's processed orders
router.get(
  "/employee/orders",
  authenticateToken,
  requireEmployeeOrAdmin,
  async (req, res) => {
    const db = req.app.locals.db;
    const employeeId = req.user.userId;
    const { page = 1, limit = 10, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;

    try {
      let dateFilter = "";
      let queryParams = [employeeId];

      if (date_from && date_to) {
        dateFilter = " AND DATE(o.created_at) BETWEEN ? AND ?";
        queryParams.push(date_from, date_to);
      }

      const [orders] = await db.promise().query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email,
              a.label as address_label, a.name as recipient_name, 
              a.address_line, a.city, a.postal_code, a.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.employee_id = ? ${dateFilter}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      // Get total count for pagination
      const [totalCount] = await db
        .promise()
        .query(
          `SELECT COUNT(*) as total FROM orders o WHERE o.employee_id = ? ${dateFilter}`,
          queryParams
        );

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].total,
          pages: Math.ceil(totalCount[0].total / limit),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get employee's best selling products
router.get(
  "/employee/best-products",
  authenticateToken,
  requireEmployeeOrAdmin,
  async (req, res) => {
    const db = req.app.locals.db;
    const employeeId = req.user.userId;

    try {
      const [products] = await db.promise().query(
        `SELECT p.id, p.name, p.image, b.name as brand_name,
              SUM(oi.quantity) as total_sold,
              SUM(oi.price * oi.quantity) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE o.employee_id = ?
       GROUP BY p.id, p.name, p.image, b.name
       ORDER BY total_sold DESC
       LIMIT 10`,
        [employeeId]
      );

      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
