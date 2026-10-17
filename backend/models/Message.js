const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: { type: String, required: true }, // We will store the user's name here
    text: { type: String, required: true },
    route: { type: String, required: true }, // e.g., "Raigarh to Raipur"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);