const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all categories
router.get("/", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [categories] = await db.promise().query("SELECT * FROM categories");
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
