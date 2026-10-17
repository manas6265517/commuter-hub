require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import your route files
const statusRoutes = require('./routes/statusRoutes');
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/authRoutes'); 
const messageRoutes = require('./routes/messageRoutes'); // <-- NEW: Import message routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB is Connected!'))
  .catch(err => console.log(err));

// Use the routes
app.use('/api/status', statusRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/messages', messageRoutes); // <-- NEW: Connect message routes to the /api/messages path

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));