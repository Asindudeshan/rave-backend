const express = require("express");
const router = express.Router();

// Get billing summary
router.get("/summary", (req, res) => {
  const db = req.app.locals.db;
  const query = `
    SELECT 
      COALESCE(COUNT(DISTINCT o.id), 0) as total_orders,
      COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
      COALESCE(AVG(oi.quantity * oi.price), 0) as avg_order_value,
      COALESCE(COUNT(DISTINCT o.user_id), 0) as total_customers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status = 'delivered'
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = results[0] || {};
    res.json({
      total_orders: Number(result.total_orders) || 0,
      total_revenue: Number(result.total_revenue) || 0,
      avg_order_value: Number(result.avg_order_value) || 0,
      total_customers: Number(result.total_customers) || 0,
    });
  });
});

// Get recent orders
router.get("/recent-orders", (req, res) => {
  const db = req.app.locals.db;
  const query = `
    SELECT 
      o.id,
      u.name as customer_name,
      o.created_at,
      o.status,
      SUM(oi.quantity * oi.price) as total_amount
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

// Get best selling products
router.get("/best-products", (req, res) => {
  const db = req.app.locals.db;
  const query = `
    SELECT 
      p.name,
      b.name as brand,
      SUM(oi.quantity) as total_sold,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 5
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

// Get daily sales
router.get("/daily-sales", (req, res) => {
  const db = req.app.locals.db;
  const query = `
    SELECT 
      DATE(o.created_at) as date,
      COUNT(o.id) as orders_count,
      SUM(oi.quantity * oi.price) as daily_revenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status = 'delivered'
    AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(o.created_at)
    ORDER BY date DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

module.exports = router;
