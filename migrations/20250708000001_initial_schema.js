exports.up = function (knex) {
  return (
    knex.schema
      // Create users table
      .createTable("users", function (table) {
        table.increments("id").primary();
        table.string("name", 100).notNullable();
        table.string("email", 100).unique().notNullable();
        table.string("password", 255).notNullable();
        table.enum("role", ["admin", "customer"]).defaultTo("customer");
        table.string("phone", 20);
        table.text("address");
        table.timestamps(true, true);
      })

      // Create brands table
      .createTable("brands", function (table) {
        table.increments("id").primary();
        table.string("name", 100).unique().notNullable();
        table.text("description");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Create colors table
      .createTable("colors", function (table) {
        table.increments("id").primary();
        table.string("name", 50).unique().notNullable();
        table.string("hex_code", 7);
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Create sections table
      .createTable("sections", function (table) {
        table.increments("id").primary();
        table.string("name", 20).unique().notNullable();
        table.text("description");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Create genders table
      .createTable("genders", function (table) {
        table.increments("id").primary();
        table.string("name", 20).unique().notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Create categories table
      .createTable("categories", function (table) {
        table.increments("id").primary();
        table.string("name", 50).notNullable();
        table.text("description");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Create products table
      .createTable("products", function (table) {
        table.increments("id").primary();
        table.string("name", 200).notNullable();
        table.integer("brand_id").unsigned().references("id").inTable("brands");
        table.decimal("price", 10, 2).notNullable();
        table.integer("stock").defaultTo(0);
        table.integer("low_stock_threshold").defaultTo(5);
        table.string("image", 255);
        table
          .integer("category_id")
          .unsigned()
          .references("id")
          .inTable("categories");
        table
          .integer("section_id")
          .unsigned()
          .references("id")
          .inTable("sections");
        table
          .integer("gender_id")
          .unsigned()
          .references("id")
          .inTable("genders");
        table.string("size", 20);
        table
          .integer("base_color_id")
          .unsigned()
          .references("id")
          .inTable("colors");
        table
          .integer("second_color_id")
          .unsigned()
          .references("id")
          .inTable("colors");
        table.text("description");
        table.timestamps(true, true);
      })

      // Create orders table
      .createTable("orders", function (table) {
        table.increments("id").primary();
        table
          .integer("user_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("users");
        table
          .enum("status", [
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ])
          .defaultTo("pending");
        table.decimal("total_price", 10, 2).notNullable();
        table.text("shipping_address");
        table.string("phone", 20);
        table.text("notes");
        table.timestamps(true, true);
      })

      // Create order_items table
      .createTable("order_items", function (table) {
        table.increments("id").primary();
        table
          .integer("order_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("orders")
          .onDelete("CASCADE");
        table
          .integer("product_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("products");
        table.integer("quantity").notNullable();
        table.decimal("price", 10, 2).notNullable();
      })

      // Create invoices table
      .createTable("invoices", function (table) {
        table.increments("id").primary();
        table
          .integer("user_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("users");
        table
          .integer("order_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("orders");
        table.decimal("amount", 10, 2).notNullable();
        table
          .enum("status", ["pending", "paid", "cancelled"])
          .defaultTo("pending");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })

      // Create commissions table
      .createTable("commissions", function (table) {
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
      })

      // Create messages table
      .createTable("messages", function (table) {
        table.increments("id").primary();
        table
          .integer("user_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("users");
        table.text("message_text").notNullable();
        table
          .enum("type", ["sms", "email", "notification"])
          .defaultTo("notification");
        table
          .enum("status", ["pending", "sent", "failed"])
          .defaultTo("pending");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("messages")
    .dropTableIfExists("commissions")
    .dropTableIfExists("invoices")
    .dropTableIfExists("order_items")
    .dropTableIfExists("orders")
    .dropTableIfExists("products")
    .dropTableIfExists("categories")
    .dropTableIfExists("genders")
    .dropTableIfExists("sections")
    .dropTableIfExists("colors")
    .dropTableIfExists("brands")
    .dropTableIfExists("users");
};
