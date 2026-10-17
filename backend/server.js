const http = require('http');
const { Server } = require('socket.io');

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

app.set('io', io);

// Use the routes
app.use('/api/status', statusRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/messages', messageRoutes); // <-- NEW: Connect message routes to the /api/messages path

// Start server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For production, replace '*' with your frontend URL
    methods: ['GET', 'POST', 'DELETE']
  }
});

// Pass io to your routes if needed, or handle events directly here
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Update app.listen to server.listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});