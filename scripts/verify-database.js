const knex = require("knex");
const knexfile = require("../knexfile");

// Initialize knex with development configuration
const db = knex(knexfile.development);

async function verifyDatabase() {
  try {
    console.log("Verifying database structure...");

    // Get list of all tables
    const tables = await db.raw("SHOW TABLES");
    console.log("\nDatabase Tables:");
    tables[0].forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // Sample data check for users table
    console.log("\nSample Users:");
    const users = await db("users")
      .select("id", "name", "email", "role")
      .limit(5);
    console.log(users);

    // Sample data check for products table
    console.log("\nSample Products:");
    const products = await db("products")
      .select("id", "name", "price", "stock")
      .limit(5);
    console.log(products);

    console.log("\nDatabase verification completed!");
  } catch (error) {
    console.error("Error verifying database:", error);
  } finally {
    await db.destroy();
  }
}

verifyDatabase();
