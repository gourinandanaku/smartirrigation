import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Use createRequire to safely import CommonJS models/modules within an ES module
const require = createRequire(import.meta.url);
const fs = require('fs');
const mongoose = require('mongoose');
const Crop = require('../models/Crop');
const Order = require('../models/Order');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Replace with exact URL containing explicit IP addresses to bypass local DNS SRV blocking
const MONGO_URI = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

// Helper: Realistic names for generation enhancement
const REALISTIC_NAMES = [
  "Organic Tomatoes", "Fresh Ginger", "Sweet Mangoes", "Washed Potatoes", 
  "Citrus Oranges", "Organic Spinach", "Green Cabbage", "Red Onions", 
  "Basmati Rice", "Wheat Grain", "Golden Corn", "Ripe Bananas",
  "Fresh Broccoli", "Organic Carrots", "Bell Peppers"
];

// Helper: Random item generator
export const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const getRandomLocation = () => getRandom(["Wayanad", "Palakkad", "Kochi", "Ernakulam", "Idukki", "Alleppey", "Kottayam", "Thrissur"]);

export const transformData = (rawDataArray) => {
  return rawDataArray.map(item => {
    // 1. Determine if crop name is just a weird numeric mapping like "0.0"
    const isBadName = !item.name || !isNaN(Number(item.name));
    const finalName = isBadName ? getRandom(REALISTIC_NAMES) : item.name;

    // 2. Enhance description dynamically based on the enhanced name
    const finalDesc = (item.description === "Fresh farm produce") 
      ? `Locally sourced ${finalName.toLowerCase()} grown with safe agricultural practices.`
      : item.description;

    // 3. Ensure valid ObjectId
    const finalFarmerId = mongoose.Types.ObjectId.isValid(item.farmerId)
      ? new mongoose.Types.ObjectId(item.farmerId)
      : new mongoose.Types.ObjectId();

    // 4. Force valid numbers & future/past dates
    return {
      name: finalName,
      description: finalDesc,
      price: Math.max(0.01, Number(item.price) || (Math.random() * 10 + 1)),
      quantity: Math.max(1, Number(item.quantity) || Math.floor(Math.random() * 200 + 50)),
      dateOfPlanting: new Date(item.dateOfPlanting || new Date(Date.now() - 90*24*60*60*1000)),
      estimatedHarvestTime: new Date(item.estimatedHarvestTime || new Date(Date.now() + 30*24*60*60*1000)),
      location: item.location || getRandomLocation(),
      imageUrl: item.imageUrl || `https://source.unsplash.com/featured/?${encodeURIComponent(finalName)}`,
      farmerId: finalFarmerId
    };
  });
};

async function runPipeline() {
  try {
    // STEP 1: DATA INGESTION
    console.log('[1/5] Ingesting raw JSON...');
    const rawPath = join(__dirname, '../../Marketplace/actualdata/formatted_crops.json');
    const rawJSON = fs.readFileSync(rawPath, 'utf8');
    const rawDataset = JSON.parse(rawJSON);

    // STEP 2 & 3: DATA TRANSFORMATION & ENHANCEMENT
    console.log('[2/5] Transforming and enhancing data...');
    const cleanedDataset = transformData(rawDataset);

    // Write cleaned dataset back out for review
    const outPath = join(__dirname, 'cleaned_dataset.json');
    fs.writeFileSync(outPath, JSON.stringify(cleanedDataset, null, 2));
    console.log(`      => Cleaned dataset saved to ${outPath}`);

    // STEP 4: DATABASE INSERTION
    console.log('[3/5] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('[4/5] Clearing prior records and executing insertMany()...');
    await Crop.deleteMany({});
    await Order.deleteMany({}); // Wipe old orders to simulate a fresh system
    const insertedCrops = await Crop.insertMany(cleanedDataset);
    console.log(`      => Inserted ${insertedCrops.length} crops safely.`);

    // STEP 6: OPTIONAL SEEDING (Simulating checkout cart to orders)
    console.log('[5/5] Generating mock orders tied to new crops...');
    const mockBuyerId = new mongoose.Types.ObjectId().toString();
    const mockOrders = [
      {
        buyerId: mockBuyerId,
        items: [ { cropId: insertedCrops[0]._id, quantity: 5 } ],
        totalAmount: insertedCrops[0].price * 5,
        paymentMethod: 'ONLINE',
        paymentStatus: 'completed',
        orderStatus: 'confirmed'
      },
      {
        buyerId: mockBuyerId,
        items: [ { cropId: insertedCrops[1]._id, quantity: 1 } ],
        totalAmount: insertedCrops[1].price * 1,
        paymentMethod: 'COD',
        paymentStatus: 'pending',
        orderStatus: 'placed'
      }
    ];
    await Order.insertMany(mockOrders);
    console.log('      => Inserted 2 mock orders.');

    console.log('\n✅ Pipeline Success! Run tests via Postman or the Frontend.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Pipeline Failed:', error);
    process.exit(1);
  }
}

// Execute Script
runPipeline();
