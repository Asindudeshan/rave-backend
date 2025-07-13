const mysql = require("mysql2/promise");

async function createDatabase() {
  // Connection without database name
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
  });

  try {
    // Create the database if it doesn't exist
    await connection.query("CREATE DATABASE IF NOT EXISTS rave_collection");
    console.log('Database "rave_collection" created or already exists');
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    await connection.end();
  }
}

createDatabase();
