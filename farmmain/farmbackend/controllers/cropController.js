const Crop = require('../models/Crop');

// @desc    Add a new crop
// @route   POST /api/crops
// @access  Public (Will be Private when Auth is added)
const addCrop = async (req, res) => {
  try {
    const { 
      name, description, price, quantity, 
      dateOfPlanting, estimatedHarvestTime, 
      imageUrl, farmerId 
    } = req.body;

    const crop = new Crop({
      name,
      description,
      price,
      quantity,
      dateOfPlanting,
      estimatedHarvestTime,
      imageUrl,
      farmerId
    });

    const createdCrop = await crop.save();
    res.status(201).json({ success: true, data: createdCrop });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid crop data', error: error.message });
  }
};

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
const getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find({});
    res.json({ success: true, data: crops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching crops', error: error.message });
  }
};

// @desc    Get single crop by ID
// @route   GET /api/crops/:id
// @access  Public
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (crop) {
      res.json({ success: true, data: crop });
    } else {
      res.status(404).json({ success: false, message: 'Crop not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching crop', error: error.message });
  }
};

// @desc    Update a crop
// @route   PUT /api/crops/:id
// @access  Public (Will be Private when Auth is added)
const updateCrop = async (req, res) => {
  try {
    const { 
      name, description, price, quantity, 
      dateOfPlanting, estimatedHarvestTime, imageUrl 
    } = req.body;

    const crop = await Crop.findById(req.params.id);

    if (crop) {
      crop.name = name || crop.name;
      crop.description = description !== undefined ? description : crop.description;
      crop.price = price || crop.price;
      crop.quantity = quantity || crop.quantity;
      crop.dateOfPlanting = dateOfPlanting || crop.dateOfPlanting;
      crop.estimatedHarvestTime = estimatedHarvestTime || crop.estimatedHarvestTime;
      crop.imageUrl = imageUrl || crop.imageUrl;

      const updatedCrop = await crop.save();
      res.json({ success: true, data: updatedCrop });
    } else {
      res.status(404).json({ success: false, message: 'Crop not found' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid crop update data', error: error.message });
  }
};

// @desc    Delete a crop
// @route   DELETE /api/crops/:id
// @access  Public (Will be Private when Auth is added)
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (crop) {
      await crop.deleteOne();
      res.json({ success: true, message: 'Crop deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Crop not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting crop', error: error.message });
  }
};

module.exports = {
  addCrop,
  getAllCrops,
  getCropById,
  updateCrop,
  deleteCrop
};
