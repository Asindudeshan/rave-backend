exports.up = function (knex) {
  return (
    knex.schema
      // Add indexes to products table for common queries
      .alterTable("products", function (table) {
        table.index(["brand_id"]);
        table.index(["category_id"]);
        table.index(["section_id"]);
        table.index(["gender_id"]);
      })
      // Add indexes to orders table
      .alterTable("orders", function (table) {
        table.index(["user_id"]);
        table.index(["status"]);
        table.index(["created_at"]);
        table.index(["employee_id"]);
      })
      // Add index to order_items table
      .alterTable("order_items", function (table) {
        table.index(["product_id"]);
      })
      // Add indexes to employee_commissions table
      .alterTable("employee_commissions", function (table) {
        table.index(["employee_id"]);
        table.index(["year", "month"]);
      })
  );
};

exports.down = function (knex) {
  return (
    knex.schema
      // Remove indexes from products table
      .alterTable("products", function (table) {
        table.dropIndex(["brand_id"]);
        table.dropIndex(["category_id"]);
        table.dropIndex(["section_id"]);
        table.dropIndex(["gender_id"]);
      })
      // Remove indexes from orders table
      .alterTable("orders", function (table) {
        table.dropIndex(["user_id"]);
        table.dropIndex(["status"]);
        table.dropIndex(["created_at"]);
        table.dropIndex(["employee_id"]);
      })
      // Remove index from order_items table
      .alterTable("order_items", function (table) {
        table.dropIndex(["product_id"]);
      })
      // Remove indexes from employee_commissions table
      .alterTable("employee_commissions", function (table) {
        table.dropIndex(["employee_id"]);
        table.dropIndex(["year", "month"]);
      })
  );
};
