const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const db = req.app.locals.db;

  try {
    // Check if user exists
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, phone, address]
      );

    res
      .status(201)
      .json({ message: "User created successfully", userId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  try {
    // Find user
    const [users] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get profile
router.get("/profile", authenticateToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT id, name, email, phone, address, role FROM users WHERE id = ?",
        [req.user.userId]
      );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user role (admin only)
router.put(
  "/update-role",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { email, role } = req.body;
    const db = req.app.locals.db;

    try {
      // Validate role
      if (!["admin", "customer", "employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Find user by email
      const [users] = await db
        .promise()
        .query("SELECT id FROM users WHERE email = ?", [email]);

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user role
      await db
        .promise()
        .query("UPDATE users SET role = ? WHERE email = ?", [role, email]);

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get all users (admin only)
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC"
      );

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Find user by phone number
router.get("/by-phone/:phone", async (req, res) => {
  const { phone } = req.params;
  const db = req.app.locals.db;

  try {
    const [users] = await db
      .promise()
      .query("SELECT id, name, email, phone FROM users WHERE phone = ?", [
        phone,
      ]);

    if (users.length > 0) {
      res.json(users[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
