const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import your route files
const ticketRoutes = require('./routes/ticketRoutes');
const statusRoutes = require('./routes/statusRoutes');
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/authRoutes'); 
const messageRoutes = require('./routes/messageRoutes'); 

const app = express();

// 1. Create HTTP server and initialize Socket.io FIRST
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For production, replace '*' with your frontend URL
    methods: ['GET', 'POST', 'DELETE']
  }
});

// 2. Attach io to the Express app so your routes can use it
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB is Connected!'))
  .catch(err => console.log(err));

// Use the routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/messages', messageRoutes); 

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server using server.listen (NOT app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});