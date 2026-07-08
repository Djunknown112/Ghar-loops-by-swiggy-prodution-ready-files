// ==== DASH-API-SWIGGY-INSTAMART ====
// Replace this mock function with a real call to Swiggy's Instamart MCP server.
// Endpoint: mcp.swiggy.com/im
// Auth: OAuth 2.1 with PKCE (see mcp.swiggy.com/builders/docs)
// Expected input: { query: string }
// Expected output: array of { productId, name, brand, price, unit, category }
// API key / staging credentials go in: .env as SWIGGY_IM_CLIENT_ID / SWIGGY_IM_CLIENT_SECRET
// ==================================

// TODO: replace with real Swiggy Instamart MCP call once production credentials are issued

export interface SwiggyProduct {
  productId: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  category: "Groceries" | "Meals" | "Medicines" | "Subscriptions";
  description?: string;
}

export const mockProducts: SwiggyProduct[] = [
  // GROCERIES
  {
    productId: "im_milk_01",
    name: "Nandini Fresh Pasteurized Milk",
    brand: "Nandini",
    price: 27,
    unit: "500 ml",
    category: "Groceries",
    description: "Daily fresh pasteurized standardized milk."
  },
  {
    productId: "im_milk_02",
    name: "Amul Taaza Toned Milk",
    brand: "Amul",
    price: 54,
    unit: "1 L",
    category: "Groceries",
    description: "Homogenized toned milk with long shelf life."
  },
  {
    productId: "im_toor_01",
    name: "Tata Sampann Unpolished Toor Dal",
    brand: "Tata Sampann",
    price: 185,
    unit: "1 kg",
    category: "Groceries",
    description: "Rich in protein, unpolished natural split pigeon peas."
  },
  {
    productId: "im_atta_01",
    name: "Aashirvaad Shudh Chakki Atta",
    brand: "Aashirvaad",
    price: 245,
    unit: "5 kg",
    category: "Groceries",
    description: "100% stone-ground whole wheat flour for soft rotis."
  },
  {
    productId: "im_rice_01",
    name: "India Gate Super Basmati Rice",
    brand: "India Gate",
    price: 155,
    unit: "1 kg",
    category: "Groceries",
    description: "Aromatic extra-long grain basmati rice."
  },
  {
    productId: "im_eggs_01",
    name: "Eggoz Farm Fresh White Eggs",
    brand: "Eggoz",
    price: 85,
    unit: "6 pieces",
    category: "Groceries",
    description: "High protein, herbal-fed farm fresh eggs."
  },
  {
    productId: "im_bread_01",
    name: "Modern 100% Whole Wheat Bread",
    brand: "Modern",
    price: 45,
    unit: "400 g",
    category: "Groceries",
    description: "Soft and nutritious fiber-rich brown bread."
  },
  {
    productId: "im_butter_01",
    name: "Amul Butter Pasteurized",
    brand: "Amul",
    price: 56,
    unit: "100 g",
    category: "Groceries",
    description: "Utterly butterly delicious salted table butter."
  },
  {
    productId: "im_oil_01",
    name: "Fortune Sunlite Refined Sunflower Oil",
    brand: "Fortune",
    price: 135,
    unit: "1 L",
    category: "Groceries",
    description: "Light and healthy refined cooking oil."
  },
  {
    productId: "im_sugar_01",
    name: "Madhur Pure & Hygienic Sugar",
    brand: "Madhur",
    price: 60,
    unit: "1 kg",
    category: "Groceries",
    description: "Sulphur-free, fine-grained sweet refined sugar."
  },
  {
    productId: "im_coffee_01",
    name: "Nescafe Classic Instant Coffee",
    brand: "Nescafe",
    price: 190,
    unit: "100 g",
    category: "Groceries",
    description: "100% pure instant coffee with rich aroma."
  },
  {
    productId: "im_onion_01",
    name: "Fresh Onion (Pyaz)",
    brand: "Instamart Fresh",
    price: 38,
    unit: "1 kg",
    category: "Groceries",
    description: "Locally sourced crispy, pink-skinned onions."
  },
  {
    productId: "im_tomato_01",
    name: "Fresh Hybrid Tomato (Tamatar)",
    brand: "Instamart Fresh",
    price: 29,
    unit: "500 g",
    category: "Groceries",
    description: "Firm, tangy red tomatoes perfect for gravies."
  },

  // MEALS
  {
    productId: "food_biryani_01",
    name: "Hyderabadi Chicken Dum Biryani",
    brand: "Behrouz Biryani",
    price: 349,
    unit: "1 Portioned box",
    category: "Meals",
    description: "Slow-cooked fragrant long grain basmati rice with tender chicken."
  },
  {
    productId: "food_chicken_01",
    name: "Butter Chicken with 2 Butter Naan",
    brand: "Moti Mahal Deluxe",
    price: 299,
    unit: "1 Meal combo",
    category: "Meals",
    description: "Classic rich, creamy tomato gravy chicken with clay oven flatbreads."
  },
  {
    productId: "food_paneer_01",
    name: "Kadhai Paneer & Jeera Rice Meal",
    brand: "Bowl Company",
    price: 199,
    unit: "1 Single Bowl",
    category: "Meals",
    description: "Spicy cottage cheese chunks with cumin-infused basmati rice."
  },
  {
    productId: "food_dosa_01",
    name: "Ghee Masala Dosa with Sambar",
    brand: "MTR Restaurant",
    price: 120,
    unit: "1 Plate",
    category: "Meals",
    description: "Crispy rice crepe with potato mash, clarified butter, and lentil stew."
  },
  {
    productId: "food_pizza_01",
    name: "Double Cheese Margherita Pizza (Medium)",
    brand: "La Pinoz",
    price: 279,
    unit: "1 Pizza",
    category: "Meals",
    description: "Classic pizza topped with extra stringy mozzarella cheese."
  },

  // MEDICINES
  {
    productId: "med_para_01",
    name: "Crocin Advance 650mg Paracetamol",
    brand: "Crocin",
    price: 32,
    unit: "15 tablets",
    category: "Medicines",
    description: "Fast relief from fever and body aches."
  },
  {
    productId: "med_cough_01",
    name: "Benadryl DR Dry Cough Syrup",
    brand: "Benadryl",
    price: 145,
    unit: "100 ml",
    category: "Medicines",
    description: "Soothes throat irritation and relieves dry cough."
  },
  {
    productId: "med_antacid_01",
    name: "Eno Fruit Salt Lemon",
    brand: "Eno",
    price: 90,
    unit: "10 sachets",
    category: "Medicines",
    description: "Relieves acidity in just 6 seconds."
  },
  {
    productId: "med_vit_01",
    name: "Limcee Vitamin C Chewable Tablets",
    brand: "Limcee",
    price: 45,
    unit: "15 tablets",
    category: "Medicines",
    description: "Daily immunity booster with orange flavor."
  },
  {
    productId: "med_band_01",
    name: "Band-Aid Washproof Bandages",
    brand: "Band-Aid",
    price: 50,
    unit: "20 pieces",
    category: "Medicines",
    description: "Water-resistant sterile adhesive strips for small cuts."
  },

  // SUBSCRIPTIONS (Daily/Weekly household essential deliveries)
  {
    productId: "sub_milk_daily",
    name: "Daily Amul Gold Milk Subscription",
    brand: "Amul Daily",
    price: 66,
    unit: "1 L per day",
    category: "Subscriptions",
    description: "Full cream rich milk delivered to your door every morning."
  },
  {
    productId: "sub_coconut_daily",
    name: "Tender Coconut Water Subscription",
    brand: "Organic Farms",
    price: 65,
    unit: "1 Piece per day",
    category: "Subscriptions",
    description: "Fresh, hydrating coconut delivered before 7:00 AM."
  },
  {
    productId: "sub_veggies_weekly",
    name: "Weekly Organic Salad & Veggie Basket",
    brand: "Instamart Green",
    price: 299,
    unit: "3 kg weekly assortment",
    category: "Subscriptions",
    description: "Curated organic fresh vegetables including coriander, spinach, cucumber, and carrots."
  },
  {
    productId: "sub_newspaper_daily",
    name: "The Times of India (Daily Print)",
    brand: "TOI Group",
    price: 7,
    unit: "1 Copy daily",
    category: "Subscriptions",
    description: "Daily English national newspaper print delivered to your doorstep."
  },
  {
    productId: "sub_eggs_weekly",
    name: "Weekly Free Range Eggs Subscription",
    brand: "Eggoz Farm",
    price: 160,
    unit: "12 eggs weekly",
    category: "Subscriptions",
    description: "12 fresh organic eggs delivered every Sunday morning."
  }
];
