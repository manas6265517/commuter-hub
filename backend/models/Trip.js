const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startStation: { type: String, required: true, default: 'Raigarh' },
    endStation: { type: String, required: true, default: 'Raipur' },
    trainName: { type: String, required: true, default: 'Janshatabdi Express' },
    travelDate: { type: Date, required: true },
    ticketCost: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);