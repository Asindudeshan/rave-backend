exports.up = function (knex) {
  return (
    knex.schema
      // Create commission_rates table for managing commission rates by range
      .createTable("commission_rates", function (table) {
        table.increments("id").primary();
        table.string("name", 100).notNullable(); // e.g., "Basic", "Standard", "Premium"
        table.decimal("min_sales", 10, 2).notNullable().defaultTo(0); // Minimum sales amount
        table.decimal("max_sales", 10, 2).nullable(); // Maximum sales amount (null for unlimited)
        table.decimal("commission_rate", 5, 4).notNullable(); // Commission rate as decimal (e.g., 0.05 for 5%)
        table.boolean("is_active").defaultTo(true);
        table.timestamps(true, true);
      })

      // Create employee_commissions table for tracking monthly commissions
      .createTable("employee_commissions", function (table) {
        table.increments("id").primary();
        table
          .integer("employee_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table.integer("year").notNullable();
        table.integer("month").notNullable(); // 1-12
        table.decimal("total_sales", 10, 2).notNullable().defaultTo(0);
        table.decimal("commission_rate", 5, 4).notNullable();
        table.decimal("commission_amount", 10, 2).notNullable().defaultTo(0);
        table
          .integer("commission_rate_id")
          .unsigned()
          .nullable()
          .references("id")
          .inTable("commission_rates");
        table.timestamps(true, true);

        // Ensure unique commission record per employee per month
        table.unique(["employee_id", "year", "month"]);
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("employee_commissions")
    .dropTableIfExists("commission_rates");
};
