const Plot = require('../models/Plot');
const CropThreshold = require('../models/CropThreshold');

// @desc    Add a new plot
// @route   POST /api/plots
const addPlot = async (req, res) => {
  try {
    const { crop, deviceId, startThreshold, stopThreshold } = req.body;

    // Check if device already exists
    const existingPlot = await Plot.findOne({ deviceId });
    if (existingPlot) {
      return res.status(400).json({ 
        success: false, 
        message: `Device ID '${deviceId}' is already assigned to plot '${existingPlot.name}'.`,
        error: "Duplicate Device ID"
      });
    }
    
    let start = startThreshold;
    let stop = stopThreshold;
    
    if (start === undefined || stop === undefined) {
      const dbThreshold = await CropThreshold.findOne({ cropName: crop });
      if (dbThreshold) {
        start = start === undefined ? dbThreshold.startThreshold : start;
        stop = stop === undefined ? dbThreshold.stopThreshold : stop;
      } else {
        start = start === undefined ? 40 : start;
        stop = stop === undefined ? 70 : stop;
      }
    }

    const plot = new Plot({
      ...req.body,
      startThreshold: start,
      stopThreshold: stop
    });

    await plot.save();
    res.status(201).json({ success: true, data: plot });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message, // Send the actual message
      error: "Plot Creation Failed" 
    });
  }
};

// @desc    Get all plots
// @route   GET /api/plots
const getPlots = async (req, res) => {
  try {
    const plots = await Plot.find();
    res.json({ success: true, data: plots });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching plots", error: err.message });
  }
};

// @desc    Delete a plot
// @route   DELETE /api/plots/:id
const deletePlot = async (req, res) => {
  try {
    await Plot.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plot deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting plot", error: err.message });
  }
};

// @desc    Get crop thresholds
// @route   GET /api/crop-thresholds
const getCropThresholds = async (req, res) => {
  try {
    const thresholds = await CropThreshold.find();
    res.json({ success: true, data: thresholds });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching thresholds", error: err.message });
  }
};

// @desc    Create crop threshold
// @route   POST /api/crop-thresholds
const createCropThreshold = async (req, res) => {
  try {
    const threshold = new CropThreshold(req.body);
    await threshold.save();
    res.status(201).json({ success: true, data: threshold });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error creating threshold", error: err.message });
  }
};

// @desc    Get threshold by deviceId
// @route   GET /api/threshold/:deviceId
const getThresholdByDevice = async (req, res) => {
  try {
    const plot = await Plot.findOne({ deviceId: req.params.deviceId });
    if (!plot) return res.json({ success: true, data: { start: 40, stop: 70 } });
    res.json({ success: true, data: { start: plot.startThreshold, stop: plot.stopThreshold } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Threshold error", error: err.message });
  }
};

// @desc    Update threshold by deviceId
// @route   PUT /api/threshold/:deviceId
const updateThresholdByDevice = async (req, res) => {
  try {
    const { start, stop } = req.body;
    const plot = await Plot.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { startThreshold: start, stopThreshold: stop },
      { new: true }
    );
    if (!plot) return res.status(404).json({ success: false, message: "Plot not found" });
    res.json({ success: true, data: { start: plot.startThreshold, stop: plot.stopThreshold } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating threshold", error: err.message });
  }
};

module.exports = {
  addPlot,
  getPlots,
  deletePlot,
  getCropThresholds,
  createCropThreshold,
  getThresholdByDevice,
  updateThresholdByDevice
};
