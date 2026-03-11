const express = require('express');
const router = express.Router();
const Fare = require('../models/Fare');

// POST - Save calculated fare to MongoDB
router.post('/', async (req, res) => {
  try {
    const { userId, userName, startPoint, destination, vehicleType, passengerType, calculatedFare } = req.body;

    const newFare = new Fare({
      userId,
      userName,
      startPoint,
      destination,
      vehicleType,
      passengerType,
      calculatedFare,
      createdAt: new Date()
    });

    const savedFare = await newFare.save();

    res.json({
      success: true,
      message: 'Fare calculated and saved successfully',
      data: savedFare
    });

  } catch (error) {
    console.error('Error saving fare:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving fare',
      error: error.message
    });
  }
});

// GET - Get all fares
router.get('/', async (req, res) => {
  try {
    const fares = await Fare.find().sort({ createdAt: -1 });
    res.json({ success: true, data: fares });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;