const mongoose = require('mongoose');
const CropThreshold = require('./models/CropThreshold');

const MONGO_URI = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

const defaultThresholds = [
  { cropName: 'Rice', startThreshold: 60, stopThreshold: 80 },
  { cropName: 'Wheat', startThreshold: 40, stopThreshold: 60 },
  { cropName: 'Tomato', startThreshold: 50, stopThreshold: 70 },
  { cropName: 'Maize', startThreshold: 50, stopThreshold: 70 },
  { cropName: 'Potato', startThreshold: 55, stopThreshold: 75 }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    await CropThreshold.deleteMany({});
    console.log('Cleared existing thresholds.');

    await CropThreshold.insertMany(defaultThresholds);
    console.log(`Successfully seeded ${defaultThresholds.length} crop thresholds.`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
