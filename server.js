import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
    connectedUsers.set(socket.id, { id: socket.id });

    io.emit('update-user-list', Array.from(connectedUsers.values()));

    socket.on('connection-request', (data) => {
        socket.to(data.to).emit('connection-request', {
            from: socket.id
        });
    });

    socket.on('connection-response', (data) => {
        socket.to(data.to).emit('connection-response', {
            from: socket.id,
            accepted: data.accepted
        });
    });

    socket.on('offer', (data) => {
        socket.to(data.to).emit('offer', {
            offer: data.offer,
            sender: socket.id
        });
    });


    socket.on('peer-disconnected', () => {
        handleDisconnection(false);
        updateStatus('Peer disconnected.', true);
        setTimeout(() => updateStatus(`My ID: ${socket.id.substring(0, 5)}`), 3000);
    });
    socket.on('peer-disconnected', (data) => {
        socket.to(data.to).emit('peer-disconnected');
    });

    socket.on('answer', (data) => {
        socket.to(data.to).emit('answer', {
            answer: data.answer,
            sender: socket.id
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.to).emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        io.emit('update-user-list', Array.from(connectedUsers.values()));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running. Access via http://localhost:${PORT} or http://<YOUR_LAN_IP>:${PORT}`);
});