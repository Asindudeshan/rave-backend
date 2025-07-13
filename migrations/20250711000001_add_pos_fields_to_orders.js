exports.up = function (knex) {
  return knex.schema.alterTable("orders", function (table) {
    // Remove shipping_address and phone columns
    table.dropColumn("shipping_address");
    table.dropColumn("phone");

    // Add order_type to distinguish online vs POS orders
    table.enum("order_type", ["online", "pos"]).defaultTo("online");

    // Add employee_id for POS orders to track which employee made the sale
    table
      .integer("employee_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("orders", function (table) {
    // Remove the added columns
    table.dropColumn("employee_id");
    table.dropColumn("order_type");

    // Add back the removed columns
    table.text("shipping_address");
    table.string("phone", 20);
  });
};
