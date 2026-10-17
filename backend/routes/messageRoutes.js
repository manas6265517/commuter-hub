const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET all messages (sorted newest first)
router.get('/', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// POST a new message
router.post('/', async (req, res) => {
    try {
        const { user, text, route } = req.body;
        const newMessage = new Message({ user, text, route });
        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(400).json({ message: 'Error posting message', error: error.message });
    }
});

module.exports = router;