const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const { authenticateToken } = require("../middleware/auth");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "rave_collection",
});

// Get user addresses
router.get("/", authenticateToken, (req, res) => {
  // Check if user exists
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const query = `
    SELECT * FROM addresses 
    WHERE user_id = ? 
    ORDER BY is_default DESC, created_at DESC
  `;

  db.query(query, [req.user.userId], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error fetching addresses" });
    res.json({ data: results });
  });
});

// Create new address
router.post("/", authenticateToken, (req, res) => {
  // Check if user exists
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { label, name, address_line, city, postal_code, phone, is_default } =
    req.body;

  // If this is set as default, unset other defaults first
  if (is_default) {
    const updateQuery = "UPDATE addresses SET is_default = 0 WHERE user_id = ?";
    db.query(updateQuery, [req.user.userId], (err) => {
      if (err)
        return res.status(500).json({ message: "Error updating defaults" });

      // Now insert the new address
      insertNewAddress();
    });
  } else {
    insertNewAddress();
  }

  function insertNewAddress() {
    const insertQuery = `
      INSERT INTO addresses (user_id, label, name, address_line, city, postal_code, phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        req.user.userId,
        label,
        name,
        address_line,
        city,
        postal_code,
        phone,
        is_default || 0,
      ],
      (err, result) => {
        if (err) {
          console.error("Error inserting address:", err);
          return res.status(500).json({ message: "Error creating address" });
        }

        // Get the newly created address
        const selectQuery = "SELECT * FROM addresses WHERE id = ?";
        db.query(selectQuery, [result.insertId], (err, results) => {
          if (err)
            return res
              .status(500)
              .json({ message: "Error fetching new address" });
          res.status(201).json({ data: results[0] });
        });
      }
    );
  }
});

// Update address
router.put("/:id", authenticateToken, (req, res) => {
  // Check if user exists
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { id } = req.params;
  const { label, name, address_line, city, postal_code, phone, is_default } =
    req.body;

  // Check if address belongs to user
  const checkQuery = "SELECT * FROM addresses WHERE id = ? AND user_id = ?";
  db.query(checkQuery, [id, req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error checking address" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If this is set as default, unset other defaults first
    if (is_default) {
      const updateDefaultsQuery =
        "UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?";
      db.query(updateDefaultsQuery, [req.user.userId, id], (err) => {
        if (err)
          return res.status(500).json({ message: "Error updating defaults" });
        updateAddress();
      });
    } else {
      updateAddress();
    }

    function updateAddress() {
      const updateQuery = `
        UPDATE addresses 
        SET label = ?, name = ?, address_line = ?, city = ?, postal_code = ?, phone = ?, is_default = ?
        WHERE id = ?
      `;

      db.query(
        updateQuery,
        [
          label,
          name,
          address_line,
          city,
          postal_code,
          phone,
          is_default || 0,
          id,
        ],
        (err) => {
          if (err)
            return res.status(500).json({ message: "Error updating address" });

          // Get the updated address
          const selectQuery = "SELECT * FROM addresses WHERE id = ?";
          db.query(selectQuery, [id], (err, results) => {
            if (err)
              return res
                .status(500)
                .json({ message: "Error fetching updated address" });
            res.json({ data: results[0] });
          });
        }
      );
    }
  });
});

// Delete address
router.delete("/:id", authenticateToken, (req, res) => {
  // Check if user exists
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { id } = req.params;

  // Check if address belongs to user
  const checkQuery = "SELECT * FROM addresses WHERE id = ? AND user_id = ?";
  db.query(checkQuery, [id, req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error checking address" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Delete the address
    const deleteQuery = "DELETE FROM addresses WHERE id = ?";
    db.query(deleteQuery, [id], (err) => {
      if (err)
        return res.status(500).json({ message: "Error deleting address" });
      res.json({ message: "Address deleted successfully" });
    });
  });
});

module.exports = router;
