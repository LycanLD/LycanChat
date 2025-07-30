  const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();
const messageReactions = new Map(); // key: timestamp, value: { emoji: count, users: Set of usernames }

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    io.emit('user joined', { username, userCount: users.size });
  });

  socket.on('chat message', (data) => {
    // data should be { username, message, files?, timestamp }
    io.emit('chat message', data);
  });

  socket.on('message reaction', ({ timestamp, emoji, username }) => {
    if (!messageReactions.has(timestamp)) {
      messageReactions.set(timestamp, {});
    }
    const reactions = messageReactions.get(timestamp);
    if (!reactions[emoji]) {
      reactions[emoji] = { count: 0, users: new Set() };
    }
    const userSet = reactions[emoji].users;
    if (userSet.has(username)) {
      // User already reacted with this emoji, remove reaction
      userSet.delete(username);
      reactions[emoji].count--;
      if (reactions[emoji].count <= 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      userSet.add(username);
      reactions[emoji].count++;
    }
    io.emit('message reaction update', { timestamp, reactions: serializeReactions(reactions) });
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stop typing', (username) => {
    socket.broadcast.emit('stop typing', username);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    if (username) {
      io.emit('user left', { username, userCount: users.size });
    }
    console.log('user disconnected:', socket.id);
  });
});

function serializeReactions(reactions) {
  const result = {};
  for (const [emoji, data] of Object.entries(reactions)) {
    result[emoji] = data.count;
  }
  return result;
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
