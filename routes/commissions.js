const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Middleware to add knex to request object
const addKnexToReq = (req, res, next) => {
  req.knex = req.app.locals.knex;
  next();
};

// Apply the middleware to all routes
router.use(addKnexToReq);

// Get all commission rates
router.get("/rates", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rates = await req
      .knex("commission_rates")
      .where("is_active", true)
      .orderBy("min_sales", "asc");

    res.json(rates);
  } catch (error) {
    console.error("Error fetching commission rates:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new commission rate
router.post("/rates", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, min_sales, max_sales, commission_rate } = req.body;

    if (!name || min_sales === undefined || commission_rate === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (commission_rate < 0 || commission_rate > 1) {
      return res
        .status(400)
        .json({ message: "Commission rate must be between 0 and 1" });
    }

    const [rateId] = await req.knex("commission_rates").insert({
      name,
      min_sales,
      max_sales: max_sales || null,
      commission_rate,
    });

    const newRate = await req
      .knex("commission_rates")
      .where("id", rateId)
      .first();
    res.status(201).json(newRate);
  } catch (error) {
    console.error("Error creating commission rate:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update commission rate
router.put("/rates/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, min_sales, max_sales, commission_rate, is_active } = req.body;

    if (
      commission_rate !== undefined &&
      (commission_rate < 0 || commission_rate > 1)
    ) {
      return res
        .status(400)
        .json({ message: "Commission rate must be between 0 and 1" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (min_sales !== undefined) updateData.min_sales = min_sales;
    if (max_sales !== undefined) updateData.max_sales = max_sales || null;
    if (commission_rate !== undefined)
      updateData.commission_rate = commission_rate;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = req.knex.fn.now();

    await req.knex("commission_rates").where("id", id).update(updateData);

    const updatedRate = await req
      .knex("commission_rates")
      .where("id", id)
      .first();
    if (!updatedRate) {
      return res.status(404).json({ message: "Commission rate not found" });
    }

    res.json(updatedRate);
  } catch (error) {
    console.error("Error updating commission rate:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete commission rate
router.delete(
  "/rates/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Soft delete by setting is_active to false
      await req.knex("commission_rates").where("id", id).update({
        is_active: false,
        updated_at: req.knex.fn.now(),
      });

      res.json({ message: "Commission rate deleted successfully" });
    } catch (error) {
      console.error("Error deleting commission rate:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get employee commissions with optional filters
router.get(
  "/employee-commissions",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { employee_id, year, month } = req.query;

      let query = req
        .knex("employee_commissions as ec")
        .join("users as u", "ec.employee_id", "u.id")
        .leftJoin("commission_rates as cr", "ec.commission_rate_id", "cr.id")
        .select(
          "ec.*",
          "u.name as employee_name",
          "u.email as employee_email",
          "cr.name as commission_rate_name"
        );

      if (employee_id) query = query.where("ec.employee_id", employee_id);
      if (year) query = query.where("ec.year", year);
      if (month) query = query.where("ec.month", month);

      const commissions = await query
        .orderBy("ec.year", "desc")
        .orderBy("ec.month", "desc")
        .orderBy("u.name", "asc");

      res.json(commissions);
    } catch (error) {
      console.error("Error fetching employee commissions:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Calculate and update commissions for a specific month/year
router.post("/calculate", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month || month < 1 || month > 12) {
      return res
        .status(400)
        .json({ message: "Valid year and month (1-12) are required" });
    }

    // Get all employees
    const employees = await req.knex("users").where("role", "employee");

    if (employees.length === 0) {
      return res.json({ message: "No employees found", calculated: 0 });
    }

    const results = [];

    for (const employee of employees) {
      // Calculate total sales for the employee in the given month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const salesResult = await req
        .knex("orders")
        .where("employee_id", employee.id)
        .where("status", "delivered")
        .whereBetween("created_at", [startDate, endDate])
        .sum("total_price as total_sales")
        .first();

      const totalSales = parseFloat(salesResult.total_sales) || 0;

      // Find applicable commission rate
      const commissionRate = await req
        .knex("commission_rates")
        .where("is_active", true)
        .where("min_sales", "<=", totalSales)
        .where(function () {
          this.whereNull("max_sales").orWhere("max_sales", ">=", totalSales);
        })
        .orderBy("min_sales", "desc")
        .first();

      const rate = commissionRate
        ? parseFloat(commissionRate.commission_rate)
        : 0;
      const commissionAmount = totalSales * rate;

      // Insert or update commission record
      const existingCommission = await req
        .knex("employee_commissions")
        .where({
          employee_id: employee.id,
          year: year,
          month: month,
        })
        .first();

      const commissionData = {
        total_sales: totalSales,
        commission_rate: rate,
        commission_amount: commissionAmount,
        commission_rate_id: commissionRate ? commissionRate.id : null,
        updated_at: req.knex.fn.now(),
      };

      if (existingCommission) {
        await req
          .knex("employee_commissions")
          .where("id", existingCommission.id)
          .update(commissionData);
      } else {
        await req.knex("employee_commissions").insert({
          employee_id: employee.id,
          year: year,
          month: month,
          ...commissionData,
          created_at: req.knex.fn.now(),
        });
      }

      results.push({
        employee_id: employee.id,
        employee_name: employee.name,
        total_sales: totalSales,
        commission_rate: rate,
        commission_amount: commissionAmount,
        commission_rate_name: commissionRate
          ? commissionRate.name
          : "No Rate Applied",
      });
    }

    res.json({
      message: "Commissions calculated successfully",
      year,
      month,
      calculated: results.length,
      results,
    });
  } catch (error) {
    console.error("Error calculating commissions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get commission summary for dashboard
router.get("/summary", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get current month's total commissions
    const currentMonthTotal = await req
      .knex("employee_commissions")
      .where("year", currentYear)
      .where("month", currentMonth)
      .sum("commission_amount as total")
      .first();

    // Get total commissions for current year
    const currentYearTotal = await req
      .knex("employee_commissions")
      .where("year", currentYear)
      .sum("commission_amount as total")
      .first();

    // Get top performing employees for current month
    const topEmployees = await req
      .knex("employee_commissions as ec")
      .join("users as u", "ec.employee_id", "u.id")
      .where("ec.year", currentYear)
      .where("ec.month", currentMonth)
      .select("u.name", "ec.total_sales", "ec.commission_amount")
      .orderBy("ec.commission_amount", "desc")
      .limit(5);

    res.json({
      current_month_total: parseFloat(currentMonthTotal.total) || 0,
      current_year_total: parseFloat(currentYearTotal.total) || 0,
      top_employees: topEmployees,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    console.error("Error fetching commission summary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
