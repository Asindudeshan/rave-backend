const express = require("express");
const router = express.Router();

// Get all colors
router.get("/", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [colors] = await db
      .promise()
      .query("SELECT * FROM colors ORDER BY name");
    res.json(colors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
