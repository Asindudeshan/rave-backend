const knex = require("knex");
const knexfile = require("../knexfile");

// Initialize knex with development configuration
const db = knex(knexfile.development);

async function runMigrations() {
  try {
    console.log("Running migrations...");
    await db.migrate.latest();
    console.log("All migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
  } finally {
    await db.destroy();
  }
}

runMigrations();
