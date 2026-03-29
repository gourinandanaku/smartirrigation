const mongoose = require('mongoose')

// Connects the backend to MongoDB Atlas using the URI from .env
const connectDB = async () => {
  try {
    // Validate required env var early for clearer debugging
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables.')
    }

    // Create Mongoose connection
    const conn = await mongoose.connect(process.env.MONGO_URI)

    // Helpful startup log
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB
