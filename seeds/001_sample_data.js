exports.seed = async function (knex) {
  // Helper function to check if a table exists
  const tableExists = async (tableName) => {
    try {
      const result = await knex.schema.hasTable(tableName);
      return result;
    } catch (error) {
      console.log(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  };

  // Safe delete function - only attempts to delete if table exists
  const safeDelete = async (tableName) => {
    if (await tableExists(tableName)) {
      await knex(tableName).del();
    } else {
      console.log(`Table ${tableName} doesn't exist, skipping delete`);
    }
  };

  // Delete existing entries (in reverse order of dependency)
  await safeDelete("order_items");
  await safeDelete("orders");
  await safeDelete("invoices");
  await safeDelete("commissions");
  await safeDelete("employee_commissions");
  await safeDelete("commission_rates");
  await safeDelete("messages");
  await safeDelete("products");
  await safeDelete("categories");
  await safeDelete("brands");
  await safeDelete("colors");
  await safeDelete("sections");
  await safeDelete("genders");
  await safeDelete("addresses");
  await safeDelete("users");

  // Insert sections
  await knex("sections").insert([
    { id: 1, name: "Men", description: "Men's footwear section" },
    { id: 2, name: "Women", description: "Women's footwear section" },
    { id: 3, name: "Kids", description: "Children's footwear section" },
  ]);

  // Insert genders
  await knex("genders").insert([
    { id: 1, name: "Male" },
    { id: 2, name: "Female" },
    { id: 3, name: "Unisex" },
  ]);

  // Insert all brands
  await knex("brands").insert([
    {
      id: 1,
      name: "Nike",
      description: "Leading sports and athletic footwear brand",
    },
    {
      id: 2,
      name: "Adidas",
      description: "German sports footwear and apparel brand",
    },
    { id: 3, name: "Cole Haan", description: "Premium dress and casual shoes" },
    { id: 4, name: "Dr. Martens", description: "Iconic boots and shoes brand" },
    { id: 5, name: "Reef", description: "Beach and surf lifestyle footwear" },
    {
      id: 6,
      name: "Converse",
      description: "Classic canvas sneakers and casual shoes",
    },
    {
      id: 7,
      name: "Off White",
      description: "Luxury streetwear and footwear brand",
    },
    {
      id: 8,
      name: "Comfort Trends",
      description: "Comfortable casual footwear",
    },
    {
      id: 9,
      name: "Calvin Klein",
      description: "Premium fashion and accessories",
    },
    { id: 10, name: "Fashion Diva", description: "Glamorous women's footwear" },
    { id: 11, name: "Pampi", description: "Casual and trendy shoes" },
    { id: 12, name: "Fashion Express", description: "Fast fashion footwear" },
  ]);

  // Insert colors
  await knex("colors").insert([
    { id: 1, name: "White", hex_code: "#FFFFFF" },
    { id: 2, name: "Black", hex_code: "#000000" },
    { id: 3, name: "Brown", hex_code: "#8B4513" },
    { id: 4, name: "Blue", hex_code: "#0000FF" },
    { id: 5, name: "Red", hex_code: "#FF0000" },
    { id: 6, name: "Gray", hex_code: "#808080" },
    { id: 7, name: "Navy", hex_code: "#000080" },
    { id: 8, name: "Beige", hex_code: "#F5F5DC" },
    { id: 9, name: "Green", hex_code: "#008000" },
    { id: 10, name: "Pink", hex_code: "#FFC0CB" },
  ]);

  // Insert categories
  await knex("categories").insert([
    { id: 1, name: "Sneakers", description: "Casual and sports sneakers" },
    { id: 2, name: "Formal", description: "Formal dress shoes" },
    { id: 3, name: "Boots", description: "Boots for all occasions" },
    { id: 4, name: "Sandals", description: "Summer and casual sandals" },
    { id: 5, name: "Running", description: "Athletic running shoes" },
    { id: 6, name: "Basketball", description: "Basketball sports shoes" },
  ]);

  // Insert users
  await knex("users").insert([
    {
      id: 1,
      name: "Admin User",
      email: "admin@email.com",
      password: "$2a$10$qOLrAIaQzooCmi9NWerCfevFQVHGfb1P7CV0a.rfdfayUxkpaK8x.",
      role: "admin",
      phone: "1000000000",
    },
    {
      id: 2,
      name: "Employee User",
      email: "emp1@email.com",
      password: "$2a$10$qOLrAIaQzooCmi9NWerCfevFQVHGfb1P7CV0a.rfdfayUxkpaK8x.",
      role: "employee",
      phone: "2000000000",
    },
    {
      id: 3,
      name: "Employee User",
      email: "emp2@email.com",
      password: "$2a$10$qOLrAIaQzooCmi9NWerCfevFQVHGfb1P7CV0a.rfdfayUxkpaK8x.",
      role: "employee",
      phone: "300000000",
    },
    {
      id: 4,
      name: "Customer",
      email: "customer@email.com",
      password: "$2a$10$qOLrAIaQzooCmi9NWerCfevFQVHGfb1P7CV0a.rfdfayUxkpaK8x.",
      role: "customer",
      phone: "400000000",
    },
    {
      id: 5,
      name: "Customer2",
      email: "customer2@email.com",
      password: "$2a$10$qOLrAIaQzooCmi9NWerCfevFQVHGfb1P7CV0a.rfdfayUxkpaK8x.",
      role: "customer",
      phone: "5000000000",
    },
  ]);

  await knex("addresses").insert([
    {
      id: 1,
      user_id: 1,
      label: "Admin Home",
      name: "Admin User",
      address_line: "123 Admin Street",
      city: "Admin City",
      postal_code: "10000",
      phone: "0111000000",
      is_default: 1,
    },
    {
      id: 2,
      user_id: 2,
      label: "Employee Home",
      name: "Employee One",
      address_line: "456 Employee Lane",
      city: "Worktown",
      postal_code: "20000",
      phone: "0112000000",
      is_default: 1,
    },
    {
      id: 3,
      user_id: 3,
      label: "Employee Home 2",
      name: "Employee Two",
      address_line: "789 Staff Ave",
      city: "Jobville",
      postal_code: "21000",
      phone: "0113000000",
      is_default: 1,
    },
    {
      id: 4,
      user_id: 4,
      label: "Customer Main",
      name: "Customer",
      address_line: "321 Customer Blvd",
      city: "Buyersville",
      postal_code: "30000",
      phone: "0114000000",
      is_default: 1,
    },
    {
      id: 5,
      user_id: 5,
      label: "Customer Primary",
      name: "Customer2",
      address_line: "654 Shopper Road",
      city: "Market City",
      postal_code: "31000",
      phone: "0115000000",
      is_default: 1,
    },
    {
      id: 6,
      user_id: 5,
      label: "Customer Secondary",
      name: "Customer2",
      address_line: "888 Backup Street",
      city: "Secondville",
      postal_code: "31001",
      phone: "0115000001",
      is_default: 0,
    },
  ]);

  // These maps are used to reference data by name instead of ID
  const brandMap = {
    Nike: 1,
    Adidas: 2,
    "Off White": 7,
    "Comfort Trends": 8,
    "Calvin Klein": 9,
    "Fashion Diva": 10,
    Pampi: 11,
    "Fashion Express": 12,
  };

  const categoryMap = {
    "mens-shoes": { category_id: 1, section_id: 1, gender_id: 1 }, // Sneakers, Men, Male
    "womens-shoes": { category_id: 4, section_id: 2, gender_id: 2 }, // Sandals, Women, Female
  };

  // Brands are now inserted in one go at the beginning of the file

  // Insert products directly based on SQL dump
  await knex("products").insert([
    {
      id: 1,
      name: "Nike Air Jordan 1 Red And Black",
      brand_id: 1,
      price: 44997.0,
      stock: 3,
      low_stock_threshold: 5,
      image: "/images/products/1.jpg",
      category_id: 1,
      section_id: 1,
      gender_id: 1,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "The Nike Air Jordan 1 in Red and Black is an iconic basketball sneaker known for its stylish design and high-performance features, making it a favorite among sneaker enthusiasts and athletes.",
    },
    {
      id: 2,
      name: "Nike Baseball Cleats",
      brand_id: 1,
      price: 23997.0,
      stock: 9,
      low_stock_threshold: 5,
      image: "/images/products/2.jpg",
      category_id: 1,
      section_id: 1,
      gender_id: 1,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "Nike Baseball Cleats are designed for maximum traction and performance on the baseball field. They provide stability and support for players during games and practices.",
    },
    {
      id: 3,
      name: "Puma Future Rider Trainers",
      brand_id: 2,
      price: 26997.0,
      stock: 88,
      low_stock_threshold: 5,
      image: "/images/products/3.jpg",
      category_id: 1,
      section_id: 1,
      gender_id: 1,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "The Puma Future Rider Trainers offer a blend of retro style and modern comfort. Perfect for casual wear, these trainers provide a fashionable and comfortable option for everyday use.",
    },
    {
      id: 4,
      name: "Sports Sneakers Off White & Red",
      brand_id: 7,
      price: 35997.0,
      stock: 17,
      low_stock_threshold: 5,
      image: "/images/products/4.jpg",
      category_id: 1,
      section_id: 1,
      gender_id: 1,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "The Sports Sneakers in Off White and Red combine style and functionality, making them a fashionable choice for sports enthusiasts. The red and off-white color combination adds a bold and energetic touch.",
    },
    {
      id: 5,
      name: "Sports Sneakers Off White Red",
      brand_id: 7,
      price: 32997.0,
      stock: 61,
      low_stock_threshold: 5,
      image: "/images/products/5.jpg",
      category_id: 1,
      section_id: 1,
      gender_id: 1,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "Another variant of the Sports Sneakers in Off White Red, featuring a unique design. These sneakers offer style and comfort for casual occasions.",
    },
    {
      id: 6,
      name: "Black & Brown Slipper",
      brand_id: 8,
      price: 5997.0,
      stock: 3,
      low_stock_threshold: 5,
      image: "/images/products/6.jpg",
      category_id: 4,
      section_id: 2,
      gender_id: 2,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "The Black & Brown Slipper is a comfortable and stylish choice for casual wear. Featuring a blend of black and brown colors, it adds a touch of sophistication to your relaxation.",
    },
    {
      id: 7,
      name: "Calvin Klein Heel Shoes",
      brand_id: 9,
      price: 23997.0,
      stock: 92,
      low_stock_threshold: 5,
      image: "/images/products/7.jpg",
      category_id: 4,
      section_id: 2,
      gender_id: 2,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "Calvin Klein Heel Shoes are elegant and sophisticated, designed for formal occasions. With a classic design and high-quality materials, they complement your stylish ensemble.",
    },
    {
      id: 8,
      name: "Golden Shoes Woman",
      brand_id: 10,
      price: 14997.0,
      stock: 86,
      low_stock_threshold: 5,
      image: "/images/products/8.jpg",
      category_id: 4,
      section_id: 2,
      gender_id: 2,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "The Golden Shoes for Women are a glamorous choice for special occasions. Featuring a golden hue and stylish design, they add a touch of luxury to your outfit.",
    },
    {
      id: 9,
      name: "Pampi Shoes",
      brand_id: 11,
      price: 8997.0,
      stock: 40,
      low_stock_threshold: 5,
      image: "/images/products/9.jpg",
      category_id: 4,
      section_id: 2,
      gender_id: 2,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "Pampi Shoes offer a blend of comfort and style for everyday use. With a versatile design, they are suitable for various casual occasions, providing a trendy and relaxed look.",
    },
    {
      id: 10,
      name: "Red Shoes",
      brand_id: 12,
      price: 10497.0,
      stock: 5,
      low_stock_threshold: 5,
      image: "/images/products/10.jpg",
      category_id: 4,
      section_id: 2,
      gender_id: 2,
      size: "9",
      base_color_id: 1,
      second_color_id: null,
      description:
        "The Red Shoes make a bold statement with their vibrant red color. Whether for a party or a casual outing, these shoes add a pop of color and style to your wardrobe.",
    },
    {
      id: 11,
      name: "Test Name",
      brand_id: 6,
      price: 10000.0,
      stock: 50,
      low_stock_threshold: 5,
      image: "images/products/11.jpg",
      category_id: 3,
      section_id: null,
      gender_id: null,
      size: "22",
      base_color_id: 4,
      second_color_id: null,
      description: "Test Description",
    },
  ]);

  // Insert commission rates
  await knex("commission_rates").insert([
    {
      id: 1,
      name: "Basic",
      min_sales: 1.0,
      max_sales: 20000.0,
      commission_rate: 0.01,
      is_active: 1,
    },
    {
      id: 2,
      name: "Second",
      min_sales: 20000.0,
      max_sales: 100000.0,
      commission_rate: 0.03,
      is_active: 1,
    },
    {
      id: 3,
      name: "Pro",
      min_sales: 100001.0,
      max_sales: 500000.0,
      commission_rate: 0.05,
      is_active: 1,
    },
  ]);
};
