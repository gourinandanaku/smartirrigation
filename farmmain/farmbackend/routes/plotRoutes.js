const express = require('express');
const router = express.Router();
const {
  addPlot,
  getPlots,
  deletePlot,
  getCropThresholds,
  createCropThreshold
} = require('../controllers/plotController');

router.route('/')
  .get(getPlots)
  .post(addPlot);

router.route('/:id')
  .delete(deletePlot);

// Crop Threshold Routes
router.route('/thresholds/config')
  .get(getCropThresholds)
  .post(createCropThreshold);

module.exports = router;
