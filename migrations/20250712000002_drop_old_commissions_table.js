exports.up = function (knex) {
  return knex.schema.dropTableIfExists("commissions");
};

exports.down = function (knex) {
  return knex.schema.createTable("commissions", function (table) {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users");
    table.decimal("sales_amount", 10, 2).notNullable();
    table.decimal("commission_rate", 5, 2).defaultTo(10.0);
    table.decimal("commission_total", 10, 2).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};
