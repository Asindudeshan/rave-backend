const express = require("express");
const router = express.Router();
const path = require("path");

// Serve dashboard HTML
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

module.exports = router;
