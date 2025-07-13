const mysql = require("mysql2/promise");
const knex = require("knex");
const knexfile = require("../knexfile");

async function setupDatabase() {
  // Step 1: Create the database if it doesn't exist
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root",
    });

    const dbName = process.env.DB_NAME || "rave_collection";
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database "${dbName}" created or already exists`);
    await connection.end();
  } catch (error) {
    console.error("Error creating database:", error);
    return;
  }

  // Step 2: Initialize knex with development configuration
  const db = knex(knexfile.development);

  // Step 3: Run migrations
  try {
    console.log("Running migrations...");
    await db.migrate.latest();
    console.log("All migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    await db.destroy();
    return;
  }

  // Step 4: Run seeds
  try {
    console.log("Running seeds...");
    await db.seed.run();
    console.log("All seeds completed successfully!");
  } catch (error) {
    console.error("Error running seeds:", error);
  } finally {
    await db.destroy();
  }

  console.log("Database setup completed!");
}

setupDatabase();
