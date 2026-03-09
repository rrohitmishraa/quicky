const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

/* ---------------- PLAYER REGISTRY ---------------- */

const players = new Set();

/* ---------------- MATCHMAKING QUEUES ---------------- */

const waiting = {};

/* ---------------- SOCKET CONNECTION ---------------- */

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  /* register player */

  players.add(socket.id);

  io.emit("onlineCount", players.size);

  socket.username = null;
  socket.game = null;
  socket.room = null;

  /* ---------------- JOIN GAME ---------------- */

  socket.on("joinGame", ({ game, username }) => {
    socket.username = username;
    socket.game = game;

    if (!waiting[game]) {
      waiting[game] = [];
    }

    console.log(`${username} joined queue for ${game}`);

    /* ---------- MATCH FOUND ---------- */

    if (waiting[game].length > 0) {
      const opponent = waiting[game].shift();

      if (!opponent || opponent.disconnected) {
        waiting[game].push(socket);
        return;
      }

      const room = `room-${socket.id}-${opponent.id}`;

      socket.room = room;
      opponent.room = room;

      socket.join(room);
      opponent.join(room);

      console.log(`Match created: ${room}`);

      io.to(room).emit("gameStart", {
        room,
        players: [
          { id: opponent.id, name: opponent.username },
          { id: socket.id, name: socket.username },
        ],
      });
    } else {
      /* ---------- WAIT FOR PLAYER ---------- */

      waiting[game].push(socket);

      console.log(`Waiting for opponent in ${game}`);
    }
  });

  /* ---------------- PLAYER MOVE ---------------- */

  socket.on("move", ({ room, index }) => {
    if (!room) return;

    socket.to(room).emit("move", index);
  });

  /* ---------------- REMATCH ---------------- */

  socket.on("rematchChoice", ({ room, choice }) => {
    if (!room) return;

    socket.to(room).emit("rematchUpdate", choice);
  });

  /* ---------------- DISCONNECT ---------------- */

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    /* remove from player registry */

    players.delete(socket.id);

    io.emit("onlineCount", players.size);

    const game = socket.game;

    /* remove from waiting queue */

    if (game && waiting[game]) {
      waiting[game] = waiting[game].filter((player) => player.id !== socket.id);
    }

    /* notify opponent */

    if (socket.room) {
      socket.to(socket.room).emit("opponentLeft");
    }
  });
});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log("Socket server running on port", PORT);
});
