const knex = require("knex");
const knexfile = require("../knexfile");

// Initialize knex with development configuration
const db = knex(knexfile.development);

async function runSeeds() {
  try {
    console.log("Running seeds...");
    await db.seed.run();
    console.log("All seeds completed successfully!");
  } catch (error) {
    console.error("Error running seeds:", error);
  } finally {
    await db.destroy();
  }
}

runSeeds();
