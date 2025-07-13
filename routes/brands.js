const express = require("express");
const router = express.Router();

// Get all brands
router.get("/", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [brands] = await db
      .promise()
      .query("SELECT * FROM brands ORDER BY name");
    res.json(brands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
