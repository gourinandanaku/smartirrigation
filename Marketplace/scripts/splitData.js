const fs = require("fs");
const path = require("path");

// Load crops file using proper relative path to actualdata
const dataPath = path.join(__dirname, "../actualdata/formatted_crops.json");
const crops = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Use valid 24-character hex strings for raw ObjectIds to pass Mongoose validation seamlessly
const DUMMY_FARMER_ID = "65b9c1d2e3f4a5b6c7d8e9f2";
const DUMMY_BUYER_ID = "65b9c1d2e3f4a5b6c7d8e9f1";
const DUMMY_CROP_ID = "65b9c1d2e3f4a5b6c7d8e9f0";

// Generate crops (cleaned)
const cropsData = crops.map(crop => ({
    name: crop.name,
    description: crop.description || "",
    price: crop.price,
    quantity: crop.quantity,
    dateOfPlanting: new Date(),
    estimatedHarvestTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    location: crop.location || "India",
    imageUrl: crop.imageUrl || "https://via.placeholder.com/150",
    farmerId: DUMMY_FARMER_ID
}));

// Generate carts
const cartData = crops.slice(0, 10).map(crop => ({
    userId: DUMMY_BUYER_ID, // Mongoose Cart Schema explicitly expects 'userId'
    items: [
        {
            cropId: DUMMY_CROP_ID, // REPLACE_WITH_REAL_ID would throw Mongoose CastError
            quantity: Math.floor(Math.random() * 5) + 1
        }
    ]
}));

// Generate orders
const ordersData = crops.slice(0, 10).map(crop => ({
    buyerId: DUMMY_BUYER_ID,
    items: [
        {
            cropId: DUMMY_CROP_ID,
            quantity: Math.floor(Math.random() * 5) + 1
        }
    ],
    totalAmount: crop.price * 2,
    paymentMethod: Math.random() > 0.5 ? "COD" : "ONLINE",
    paymentStatus: Math.random() > 0.5 ? "completed" : "pending",
    orderStatus: "placed"
}));

// Save files
fs.writeFileSync("crops.json", JSON.stringify(cropsData, null, 2));
fs.writeFileSync("cart.json", JSON.stringify(cartData, null, 2));
fs.writeFileSync("orders.json", JSON.stringify(ordersData, null, 2));

console.log("✅ Files generated: crops.json, cart.json, orders.json");