const mongoose = require('mongoose');
const Crop = require('./models/Crop');

const uri = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

console.log('Connecting to database...');
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected! Executing Step 3: Refilling random stock values for depleted crops...');
    
    // Fetch all crops that have low stock (< 10) to simulate refill, or just all crops.
    // The user requested: "Update all crops with quantity = random value between 50 and 200"
    
    const allCrops = await Crop.find({});
    let updatedCount = 0;

    for (const crop of allCrops) {
      if (crop.quantity < 50) {
        const randomStock = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
        await Crop.updateOne(
          { _id: crop._id }, 
          { $set: { quantity: randomStock } }
        );
        updatedCount++;
      }
    }

    console.log(`Successfully refilled stock for ${updatedCount} crops that were running low.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to refill script:', err);
    process.exit(1);
  });
