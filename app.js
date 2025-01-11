const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');
const userRouter = require('./routes/userRoutes.js');
const path = require('path');
const chatRouter = require('./routes/chatRoutes.js');
const cookieParser = require('cookie-parser');
const friendRouter = require('./routes/friendRoutes.js');
const http = require('http');
const socketIo = require('socket.io'); // Import socket.io

const app = express();

// Set up a server with http
const server = http.createServer(app);

// Integrate socket.io with the server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up socket connection logic
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id); // When a user connects

  // Listening for chat messages from a user
  socket.on('chat message', (msg) => {
    console.log('Message received:', msg);
    // Broadcast message to all clients
    io.emit('chat message', msg);
  });

  // Listening for disconnection event
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',  // Adjust to match your frontend's URL
  methods: 'GET, POST',
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(userRouter);
app.use('/chat', chatRouter);
app.use('/friend', friendRouter);
app.use(cookieParser());

const PORT = 5000;

// Start the server with Socket.IO
server.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
