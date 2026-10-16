require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import your route files
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/authRoutes'); // <-- NEW: Import auth routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB is Connected!'))
  .catch(err => console.log(err));

// Use the routes
app.use('/api/trips', tripRoutes);
app.use('/api/auth', authRoutes); // <-- NEW: Connect auth routes to the /api/auth path

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));