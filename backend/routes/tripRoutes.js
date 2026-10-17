const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

// 1. GET ALL TRIPS: Fetch all recorded trips from the database
router.get('/', async (req, res) => {
    try {
        const trips = await Trip.find().sort({ travelDate: -1 });
        res.status(200).json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving trips', error: error.message });
    }
});

// 2. CREATE A NEW TRIP: Save a trip entry
router.post('/', async (req, res) => {
    try {
        const { startStation, endStation, trainName, travelDate, ticketCost } = req.body;

        const newTrip = new Trip({
            // Dummy user ID until authentication is plugged in
            user: "650000000000000000000001",
            startStation,
            endStation,
            trainName,
            travelDate,
            ticketCost
        });

        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        res.status(400).json({ message: 'Error saving trip', error: error.message });
    }
});

// 3. DELETE A TRIP: Remove a trip by its ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
        if (!deletedTrip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting trip', error: error.message });
    }
});

// 4. UPDATE A TRIP: Edit an existing trip by its ID
router.put('/:id', async (req, res) => {
    try {
        const updatedTrip = await Trip.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // This tells Mongoose to return the updated document
        );
        
        if (!updatedTrip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        
        res.status(200).json(updatedTrip);
    } catch (error) {
        res.status(500).json({ message: 'Error updating trip', error: error.message });
    }
});

module.exports = router;