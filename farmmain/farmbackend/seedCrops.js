const mongoose = require('mongoose');
const CropMaster = require('./models/CropMaster');

const MONGO_URI = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

const defaultCrops = [
  {
    name: "Organic Tomatoes",
    category: "Vegetable",
    description: "Hand-picked organic tomatoes grown with traditional farming methods.",
    basePrice: 1.5,
    unit: "kg",
    imageUrl: "https://source.unsplash.com/featured/?tomato"
  },
  {
    name: "Fresh Ginger",
    category: "Spice",
    description: "Aromatic and pungent ginger roots, freshly harvested.",
    basePrice: 5.0,
    unit: "kg",
    imageUrl: "https://source.unsplash.com/featured/?ginger"
  },
  {
    name: "Sweet Mangoes",
    category: "Fruit",
    description: "Naturally ripened sweet and juicy mangoes from local orchards.",
    basePrice: 3.0,
    unit: "kg",
    imageUrl: "https://source.unsplash.com/featured/?mango"
  },
  {
    name: "Washed Potatoes",
    category: "Tuber",
    description: "Premium quality washed potatoes, perfect for storage.",
    basePrice: 0.8,
    unit: "kg",
    imageUrl: "https://source.unsplash.com/featured/?potato"
  },
  {
    name: "Basmati Rice",
    category: "Grain",
    description: "Long-grain aromatic basmati rice, naturally aged.",
    basePrice: 2.2,
    unit: "kg",
    imageUrl: "https://source.unsplash.com/featured/?rice"
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    await CropMaster.deleteMany({});
    console.log('Cleared existing crop blueprints.');

    await CropMaster.insertMany(defaultCrops);
    console.log(`Successfully seeded ${defaultCrops.length} crop blueprints.`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
