const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const cors = require('cors');
const notesRouter = require('./routes/notes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', notesRouter);

// Store active rooms
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, userId }) => {
        socket.join(roomId);
        rooms[roomId] = rooms[roomId] || [];
        rooms[roomId].push(userId);
        
        // Notify others in the room
        socket.to(roomId).emit('user-joined', userId);
        
        // Send list of current participants to the new user
        socket.emit('current-participants', rooms[roomId].filter(id => id !== userId));
    });

    socket.on('leave-room', ({ roomId, userId }) => {
        socket.leave(roomId);
        if (rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(id => id !== userId);
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
        }
        socket.to(roomId).emit('user-left', userId);
    });

    socket.on('chat-message', ({ roomId, userId, message }) => {
        socket.to(roomId).emit('chat-message', { userId, message });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 