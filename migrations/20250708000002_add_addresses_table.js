exports.up = function (knex) {
  return knex.schema.createTable("addresses", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.string("label", 50).notNullable(); // e.g., "Home", "Work", "Office"
    table.string("name", 100).notNullable(); // Recipient name
    table.text("address_line").notNullable();
    table.string("city", 50).notNullable();
    table.string("postal_code", 10);
    table.string("phone", 20);
    table.boolean("is_default").defaultTo(false);
    table.timestamps(true, true);

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("addresses");
};
