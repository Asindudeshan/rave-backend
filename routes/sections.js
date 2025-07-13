const express = require("express");
const router = express.Router();

// Get all sections
router.get("/", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [sections] = await db
      .promise()
      .query("SELECT * FROM sections ORDER BY name");
    res.json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
