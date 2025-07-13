const express = require("express");
const router = express.Router();

// Get all genders
router.get("/", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [genders] = await db
      .promise()
      .query("SELECT * FROM genders ORDER BY name");
    res.json(genders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
