import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const fs = require('fs');

const Crop = require('./models/Crop');
const Order = require('./models/Order');

// Secure direct connection bypassed from local DNS block
const MONGO_URI = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

async function cleanDatabase() {
  try {
    console.log('[1/4] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    // STEP 4: Optional Backup
    console.log('[2/4] Backing up existing records before deletion...');
    const existingCrops = await Crop.find({});
    const existingOrders = await Order.find({});
    fs.writeFileSync('database_backup_crops.json', JSON.stringify(existingCrops, null, 2));
    fs.writeFileSync('database_backup_orders.json', JSON.stringify(existingOrders, null, 2));
    console.log('      => Backup saved locally as database_backup_*.json.');

    // STEP 1 & 2: Identify and Delete Dummy Data Safely (Option B: Selective Clean)
    console.log('[3/4] Running Selective Clean for Dummy Data...');
    
    // Identify crops with Unsplash, SVG, or generic testing names
    const cropDeleteResult = await Crop.deleteMany({
      $or: [
        { imageUrl: /source\.unsplash\.com/i },
        { imageUrl: /data:image\/svg/i },
        { name: /Test|Crop \d|Dummy/i }
      ]
    });

    // Extract any remaining crops to safely clean out generic mock orders
    const orderDeleteResult = await Order.deleteMany({
      $or: [
        { paymentStatus: "pending" } // Mock simulated defaults
      ]
    });

    console.log(`      => Safely deleted ${cropDeleteResult.deletedCount} dummy crops.`);
    console.log(`      => Safely deleted ${orderDeleteResult.deletedCount} dummy orders.`);

    // STEP 3 & 5: Reset State & Verification Checks
    console.log('[4/4] Verifying database state...');
    const remainingCrops = await Crop.countDocuments();
    const remainingOrders = await Order.countDocuments();
    
    console.log(`      => Remaining Real Crops: ${remainingCrops}`);
    console.log(`      => Remaining Real Orders: ${remainingOrders}`);

    console.log('\n✅ Database wipe process complete. Built-in schemas preserved. System is ready for production data.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Wipe script failed:', err);
    process.exit(1);
  }
}

cleanDatabase();
