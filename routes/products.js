const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  authenticateToken,
  requireAdmin,
  requireEmployeeOrAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../public/images/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // We'll set the filename after getting the product ID
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Helper function to delete old image file
const deleteOldImage = (imagePath) => {
  if (imagePath) {
    const fullPath = path.join(__dirname, "../public", imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Get all products
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const { category, brand, section, gender, color } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as category_name, b.name as brand_name, 
             s.name as section_name, g.name as gender_name, 
             col.name as base_color_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN sections s ON p.section_id = s.id
      LEFT JOIN genders g ON p.gender_id = g.id
      LEFT JOIN colors col ON p.base_color_id = col.id
    `;

    const conditions = [];
    const params = [];

    if (category) {
      conditions.push("p.category_id = ?");
      params.push(category);
    }
    if (brand) {
      conditions.push("p.brand_id = ?");
      params.push(brand);
    }
    if (section) {
      conditions.push("p.section_id = ?");
      params.push(section);
    }
    if (gender) {
      conditions.push("p.gender_id = ?");
      params.push(gender);
    }
    if (color) {
      conditions.push("p.base_color_id = ?");
      params.push(color);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const [products] = await db.promise().query(query, params);

    // Add full image URLs
    const productsWithImageUrls = products.map((product) => ({
      ...product,
      imageUrl: product.image ? `http://localhost:5005/${product.image}` : null,
    }));

    res.json(productsWithImageUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [products] = await db.promise().query(
      `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = {
      ...products[0],
      imageUrl: products[0].image
        ? `http://localhost:5005/${products[0].image}`
        : null,
    };

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create product (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    const {
      name,
      brand_id,
      price,
      stock,
      category_id,
      size,
      base_color_id,
      description,
    } = req.body;
    const db = req.app.locals.db;

    try {
      // First, create the product without image
      const [result] = await db
        .promise()
        .query(
          "INSERT INTO products (name, brand_id, price, stock, category_id, size, base_color_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            name,
            brand_id,
            price,
            stock,
            category_id,
            size,
            base_color_id,
            description,
          ]
        );

      const productId = result.insertId;
      let imagePath = null;

      // Handle image upload if file is provided
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        const newFileName = `${productId}${fileExtension}`;
        const newFilePath = path.join(uploadDir, newFileName);

        // Rename the uploaded file to use product ID
        fs.renameSync(req.file.path, newFilePath);

        imagePath = `images/products/${newFileName}`;

        // Update the product with the image path
        await db
          .promise()
          .query("UPDATE products SET image = ? WHERE id = ?", [
            imagePath,
            productId,
          ]);
      }

      res.status(201).json({
        message: "Product created successfully",
        productId: productId,
        imagePath: imagePath,
      });
    } catch (error) {
      console.error(error);
      // Clean up uploaded file if database operation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update product (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    const {
      name,
      brand_id,
      price,
      stock,
      category_id,
      size,
      base_color_id,
      description,
    } = req.body;
    const db = req.app.locals.db;
    const productId = req.params.id;

    try {
      // Get current product to check for existing image
      const [currentProduct] = await db
        .promise()
        .query("SELECT image FROM products WHERE id = ?", [productId]);

      if (currentProduct.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      let imagePath = currentProduct[0].image; // Keep existing image by default

      // Handle image upload if new file is provided
      if (req.file) {
        // Delete old image if it exists
        if (currentProduct[0].image) {
          deleteOldImage(currentProduct[0].image);
        }

        const fileExtension = path.extname(req.file.originalname);
        const newFileName = `${productId}${fileExtension}`;
        const newFilePath = path.join(uploadDir, newFileName);

        // Rename the uploaded file to use product ID
        fs.renameSync(req.file.path, newFilePath);

        imagePath = `images/products/${newFileName}`;
      }

      // Update the product
      await db
        .promise()
        .query(
          "UPDATE products SET name = ?, brand_id = ?, price = ?, stock = ?, category_id = ?, size = ?, base_color_id = ?, description = ?, image = ? WHERE id = ?",
          [
            name,
            brand_id,
            price,
            stock,
            category_id,
            size,
            base_color_id,
            description,
            imagePath,
            productId,
          ]
        );

      res.json({
        message: "Product updated successfully",
        imagePath: imagePath,
      });
    } catch (error) {
      console.error(error);
      // Clean up uploaded file if database operation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update product stock (Admin only)
router.put(
  "/:id/stock",
  authenticateToken,
  requireEmployeeOrAdmin,
  async (req, res) => {
    const { stock } = req.body;
    const db = req.app.locals.db;

    try {
      await db
        .promise()
        .query("UPDATE products SET stock = ? WHERE id = ?", [
          stock,
          req.params.id,
        ]);

      res.json({ message: "Stock updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete product (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const productId = req.params.id;

  try {
    // Get product image before deleting
    const [products] = await db
      .promise()
      .query("SELECT image FROM products WHERE id = ?", [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete the product from database
    await db.promise().query("DELETE FROM products WHERE id = ?", [productId]);

    // Delete associated image file if it exists
    if (products[0].image) {
      deleteOldImage(products[0].image);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload/Update product image (Admin only)
router.post(
  "/:id/image",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    const db = req.app.locals.db;
    const productId = req.params.id;

    try {
      // Check if product exists
      const [products] = await db
        .promise()
        .query("SELECT image FROM products WHERE id = ?", [productId]);

      if (products.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Delete old image if it exists
      if (products[0].image) {
        deleteOldImage(products[0].image);
      }

      const fileExtension = path.extname(req.file.originalname);
      const newFileName = `${productId}${fileExtension}`;
      const newFilePath = path.join(uploadDir, newFileName);

      // Rename the uploaded file to use product ID
      fs.renameSync(req.file.path, newFilePath);

      const imagePath = `images/products/${newFileName}`;

      // Update the product with the new image path
      await db
        .promise()
        .query("UPDATE products SET image = ? WHERE id = ?", [
          imagePath,
          productId,
        ]);

      res.json({
        message: "Product image uploaded successfully",
        imagePath: imagePath,
        imageUrl: `http://localhost:5005/${imagePath}`,
      });
    } catch (error) {
      console.error(error);
      // Clean up uploaded file if database operation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
