exports.up = function (knex) {
  return knex.schema
    .alterTable("users", function (table) {
      // Drop the existing enum constraint and recreate with employee role
      table.dropColumn("role");
    })
    .then(() => {
      return knex.schema.alterTable("users", function (table) {
        table
          .enum("role", ["admin", "customer", "employee"])
          .defaultTo("customer");
      });
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable("users", function (table) {
      table.dropColumn("role");
    })
    .then(() => {
      return knex.schema.alterTable("users", function (table) {
        table.enum("role", ["admin", "customer"]).defaultTo("customer");
      });
    });
};
