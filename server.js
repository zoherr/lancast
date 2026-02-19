#!/usr/bin/env node
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import os from 'os';

const args = process.argv.slice(2);
if (args[0] !== 'start') {
    console.log(chalk.red('\n❌ Invalid command. Please run:\n👉 npx laracast start\n'));
    process.exit(1);
}

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

const PORT = process.env.PORT || 3150;

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

server.listen(PORT, '0.0.0.0', () => {
    console.clear();

    const title = figlet.textSync('LARACAST', {
        font: 'Slant',
        horizontalLayout: 'fitted',
        verticalLayout: 'default'
    });

    console.log(chalk.cyan(title));

    const lanIP = getLocalIP();

    const message = `
🚀 Server Running Successfully

🌐 Local:   http://localhost:${PORT}
📡 Network: http://${lanIP}:${PORT}

Use port ${PORT}
`;

    console.log(
        boxen(chalk.green(message), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        })
    );
});