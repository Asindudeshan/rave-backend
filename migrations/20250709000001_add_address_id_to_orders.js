exports.up = function (knex) {
  return knex.schema.alterTable("orders", function (table) {
    table.integer("address_id").unsigned();
    table
      .foreign("address_id")
      .references("id")
      .inTable("addresses")
      .onDelete("SET NULL");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("orders", function (table) {
    table.dropForeign("address_id");
    table.dropColumn("address_id");
  });
};
