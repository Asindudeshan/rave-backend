exports.up = function (knex) {
  return knex.schema.createTable("reviews", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.integer("product_id").unsigned().notNullable();
    table.integer("order_id").unsigned().notNullable();
    table.integer("rating").notNullable().checkIn([1, 2, 3, 4, 5]);
    table.text("comment");
    table.timestamps(true, true);

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("product_id")
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table
      .foreign("order_id")
      .references("id")
      .inTable("orders")
      .onDelete("CASCADE");

    table.unique(["user_id", "product_id", "order_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("reviews");
};
