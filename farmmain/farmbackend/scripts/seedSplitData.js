const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Crop = require('../models/Crop');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const MONGO_URI = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

async function seedData() {
  try {
    console.log('[1/4] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('[2/4] Clearing existing data for Crops, Carts, Orders...');
    await Crop.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    console.log('[3/4] Loading JSON files from Marketplace/scripts...');
    const cropsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Marketplace/scripts/crops.json'), 'utf-8'));
    const cartData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Marketplace/scripts/cart.json'), 'utf-8'));
    const ordersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Marketplace/scripts/orders.json'), 'utf-8'));

    console.log(`      => Inserting ${cropsData.length} Crops...`);
    const insertedCrops = await Crop.insertMany(cropsData);
    
    console.log('[4/4] Mapping Carts & Orders to the real generated Crop ObjectIDs...');
    // Replace the dummy "65b9..." IDs with the actual live ones created by Atlas just now
    cartData.forEach((cart, index) => {
      if (cart.items && cart.items.length > 0) {
        cart.items[0].cropId = insertedCrops[index % insertedCrops.length]._id;
      }
    });
    
    ordersData.forEach((order, index) => {
      if (order.items && order.items.length > 0) {
        order.items[0].cropId = insertedCrops[index % insertedCrops.length]._id;
      }
    });

    console.log(`      => Inserting ${cartData.length} Carts...`);
    await Cart.insertMany(cartData);

    console.log(`      => Inserting ${ordersData.length} Orders...`);
    await Order.insertMany(ordersData);

    console.log('\n✅ Database successfully seeded with the JSON Split Data!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
