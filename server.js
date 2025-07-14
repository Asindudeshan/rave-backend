const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const knex = require("knex");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// Print environment info for debugging
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  PORT: PORT,
  // Masking password for security
  DB_PASSWORD: process.env.DB_PASSWORD ? "********" : "not set",
});

// Initialize Knex with the appropriate environment
const environment = process.env.NODE_ENV || "development";
const knexConfig = require("./knexfile")[environment];
const db = knex(knexConfig);


app.use(cors());


app.use(express.json());
app.use(express.static("public"));

// Database connection (legacy MySQL connection)
const mysqlDb = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "rave_collection",
});

mysqlDb.connect((err) => {
  if (err) {
    console.error("MySQL direct connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Make databases available to routes
app.locals.db = mysqlDb;
app.locals.knex = db; // Make knex instance available to all routes

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const categoryRoutes = require("./routes/categories");
const brandRoutes = require("./routes/brands");
const sectionRoutes = require("./routes/sections");
const genderRoutes = require("./routes/genders");
const colorRoutes = require("./routes/colors");
const billingRoutes = require("./routes/billing");
const dashboardRoutes = require("./routes/dashboard");
const addressRoutes = require("./routes/addresses");
const profileRoutes = require("./routes/profile");
const commissionRoutes = require("./routes/commissions");

// // Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, "./openapi.yaml"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/genders", genderRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/dashboard", dashboardRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Rave Collection API is running!",
    // documentation: "Visit /api-docs for API documentation",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
