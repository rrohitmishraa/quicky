const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

/* ---------------- PLAYER REGISTRY ---------------- */

const players = new Map();

/*
socketId → {
  socket,
  username,
  roomId
}
*/

/* ---------------- MATCHMAKING QUEUES ---------------- */

const queues = {};

/* ---------------- GAME SESSIONS ---------------- */

const sessions = {};

/*
roomId → {
  game,
  players: [username, username],
  board,
  createdAt,
  reconnectTimer
}
*/

/* ---------------- HELPERS ---------------- */

function broadcastOnlineCount() {
  io.emit("onlineCount", players.size);
}

function getPlayerByUsername(username) {
  for (const player of players.values()) {
    if (player.username === username) return player;
  }
  return null;
}

/* ---------------- CLEAN QUEUE ---------------- */

function cleanQueue(game) {
  if (!queues[game]) return;

  queues[game] = queues[game].filter((id) => {
    const player = players.get(id);
    if (!player) return false;
    if (player.roomId) return false;
    return true;
  });
}

/* ---------------- CREATE ROOM ---------------- */

function createRoom(game, playerA, playerB) {
  const roomId = `room-${Date.now()}-${Math.random()}`;

  console.log(
    "ROOM CREATED:",
    roomId,
    playerA.username,
    "vs",
    playerB.username,
  );

  sessions[roomId] = {
    game,
    players: [playerA.username, playerB.username],
    board: Array(9).fill(null),
    turn: 0,
    createdAt: Date.now(),
    reconnectTimer: null,
  };

  playerA.roomId = roomId;
  playerB.roomId = roomId;

  playerA.socket.join(roomId);
  playerB.socket.join(roomId);

  io.to(roomId).emit("gameStart", {
    room: roomId,
    players: [{ name: playerA.username }, { name: playerB.username }],
  });
}

/* ---------------- MATCHMAKING ---------------- */

function tryMatchmaking(game) {
  if (!queues[game]) return;

  // ensure queue only contains valid players
  cleanQueue(game);

  const queue = queues[game];

  while (queue.length >= 2) {
    const idA = queue.shift();
    const idB = queue.shift();

    const playerA = players.get(idA);
    const playerB = players.get(idB);

    if (!playerA || !playerB) {
      console.log("Invalid players in queue, cleaning and retrying");
      cleanQueue(game);
      continue;
    }

    console.log("MATCH FOUND:", playerA.username, "vs", playerB.username);

    createRoom(game, playerA, playerB);
  }
}

/* ---------------- SOCKET CONNECTION ---------------- */

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  players.set(socket.id, {
    socket,
    username: null,
    roomId: null,
  });

  broadcastOnlineCount();

  /* ---------------- JOIN GAME ---------------- */

  socket.on("joinGame", ({ game, username }) => {
    console.log("JOIN GAME RECEIVED:", username, game);
    const player = players.get(socket.id);

    if (!player) return;

    if (player.roomId) return;

    player.username = username;

    if (!queues[game]) queues[game] = [];

    // remove stale or invalid queue entries
    cleanQueue(game);

    // prevent duplicate queue joins
    if (!queues[game].includes(socket.id)) {
      queues[game].push(socket.id);
    }

    console.log("QUEUE", game, queues[game].length);

    tryMatchmaking(game);
  });

  /* ---------------- RECONNECT GAME ---------------- */

  socket.on("reconnectGame", ({ roomId, username }) => {
    const session = sessions[roomId];
    if (!session) return;

    if (!session.players.includes(username)) return;

    const player = players.get(socket.id);
    if (!player) return;

    player.username = username;
    player.roomId = roomId;

    socket.join(roomId);

    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }

    socket.to(roomId).emit("opponentReconnected");

    socket.emit("reconnectSuccess", {
      room: roomId,
      players: session.players,
      board: session.board,
    });
  });

  /* ---------------- MOVE ---------------- */

  socket.on("move", ({ room, index }) => {
    const session = sessions[room];
    if (!session) return;

    const player = players.get(socket.id);
    if (!player) return;

    // validate index
    if (index < 0 || index > 8) return;

    // prevent overwriting
    if (session.board[index] !== null) return;

    const playerIndex = session.players.indexOf(player.username);
    if (playerIndex === -1) return;

    // initialize turn if missing
    if (session.turn === undefined) session.turn = 0;

    // enforce turn
    if (playerIndex !== session.turn) return;

    const mark = playerIndex === 0 ? "P" : "O";

    session.board[index] = mark;

    // switch turn
    session.turn = session.turn === 0 ? 1 : 0;

    io.to(room).emit("move", {
      index,
      mark,
      turn: session.turn,
    });
  });

  /* ---------------- LEAVE ROOM ---------------- */

  socket.on("leaveRoom", (roomId) => {
    const session = sessions[roomId];
    if (!session) return;

    const player = players.get(socket.id);
    if (!player) return;

    const username = player.username;

    const opponentUsername = session.players.find((p) => p !== username);

    const opponent = getPlayerByUsername(opponentUsername);

    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }

    socket.leave(roomId);

    player.roomId = null;

    if (opponent) {
      opponent.socket.emit("opponentLeft");
      opponent.roomId = null;
    }

    delete sessions[roomId];
  });

  /* ---------------- DISCONNECT ---------------- */

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    const player = players.get(socket.id);
    if (!player) return;

    const username = player.username;
    const roomId = player.roomId;

    players.delete(socket.id);

    broadcastOnlineCount();

    /* remove from queues */

    Object.keys(queues).forEach((game) => {
      queues[game] = queues[game].filter((id) => id !== socket.id);
    });

    if (roomId && sessions[roomId]) {
      const session = sessions[roomId];

      const opponentUsername = session.players.find((u) => u !== username);

      const opponent = getPlayerByUsername(opponentUsername);

      if (opponent) {
        opponent.socket.emit("opponentDisconnected");

        if (!session.reconnectTimer) {
          session.reconnectTimer = setTimeout(() => {
            if (sessions[roomId]) {
              opponent.socket.emit("opponentLeft");
              delete sessions[roomId];
            }
          }, 15000);
        }
      }
    }
  });
});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log("Socket server running on port", PORT);
});
