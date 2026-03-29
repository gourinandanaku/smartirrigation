const express = require('express');
const router = express.Router();

// Import all functions from our crop controller
const {
  addCrop,
  getAllCrops,
  getCropById,
  updateCrop,
  deleteCrop
} = require('../controllers/cropController');

// Routes for the root /api/crops
// GET: Fetch all crops
// POST: Create a new crop
router.route('/')
  .get(getAllCrops)
  .post(addCrop);

// Routes for specific crop /api/crops/:id
// GET: Fetch single crop
// PUT: Update a specific crop
// DELETE: Remove a specific crop
router.route('/:id')
  .get(getCropById)
  .put(updateCrop)
  .delete(deleteCrop);

module.exports = router;
