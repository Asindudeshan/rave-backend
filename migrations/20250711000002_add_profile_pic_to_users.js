exports.up = function (knex) {
  return knex.schema.table("users", function (table) {
    table.string("profile_pic");
  });
};

exports.down = function (knex) {
  return knex.schema.table("users", function (table) {
    table.dropColumn("profile_pic");
  });
};
