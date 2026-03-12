const { createServer } = require("http");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");

const fs = require("fs");
const path = require("path");

const games = {};

const gamesPath = path.join(__dirname, "games");

fs.readdirSync(gamesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const name = file.replace(".js", "");
    games[name] = require(`./games/${file}`);
  }
});

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

/* ---------------- PLAYER REGISTRY ---------------- */

const players = new Map();
const playersByUsername = new Map();

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
const sessionsBySocket = new Map();

function startTurnTimer(roomId) {
  const session = sessions[roomId];
  if (!session) return;

  if (session.turnTimer) clearTimeout(session.turnTimer);

  session.turnTimer = setTimeout(() => {
    if (!sessions[roomId]) return;

    // switch turn automatically
    session.state.turn = session.state.turn === 0 ? 1 : 0;

    io.to(roomId).emit("turnUpdate", { turn: session.state.turn });

    // start next timer
    startTurnTimer(roomId);
  }, 30000);
}

/* ---------------- HELPERS ---------------- */

function broadcastOnlineCount() {
  io.emit("onlineCount", players.size);
  // io.emit("onlineCount", playersByUsername.size);
}

function getPlayerByUsername(username) {
  return playersByUsername.get(username) || null;
}

/* ---------------- CLEAN QUEUE ---------------- */

function cleanQueue(game) {
  if (!queues[game]) return;

  queues[game] = queues[game].filter((id) => {
    const player = players.get(id);

    // remove if player disconnected
    if (!player) return false;

    // keep player if not already in a room
    return player.roomId === null;
  });
}

/* ---------------- CREATE ROOM ---------------- */

function createRoom(game, playerA, playerB) {
  const roomId = nanoid(6);

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
    state: games[game].createGame(),
    createdAt: Date.now(),
    reconnectTimer: null,
    rematchRequests: {},
  };

  playerA.roomId = roomId;
  playerB.roomId = roomId;

  sessionsBySocket.set(playerA.socket.id, roomId);
  sessionsBySocket.set(playerB.socket.id, roomId);

  playerA.socket.join(roomId);
  playerB.socket.join(roomId);

  io.to(roomId).emit("gameStart", {
    room: roomId,
    players: [{ name: playerA.username }, { name: playerB.username }],
    board: sessions[roomId].state.board,
    turn: sessions[roomId].state.turn,
  });

  startTurnTimer(roomId);
}

/* ---------------- MATCHMAKING ---------------- */

// function tryMatchmaking(game) {
//   if (!queues[game]) return;

//   // ensure queue only contains valid players
//   cleanQueue(game);
//   const queue = queues[game];

//   console.log("QUEUE STATE:", queue);

//   while (queue.length >= 2) {
//     const idA = queue.shift();
//     const idB = queue.shift();

//     const playerA = players.get(idA);
//     const playerB = players.get(idB);

//     if (!playerA || !playerB) {
//       console.log("Invalid players in queue, cleaning and retrying");
//       cleanQueue(game);
//       continue;
//     }

//     console.log("MATCH FOUND:", playerA.username, "vs", playerB.username);

//     createRoom(game, playerA, playerB);
//   }
// }

/* ---------------- SOCKET CONNECTION ---------------- */

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  players.set(socket.id, {
    socket,
    username: null,
    roomId: null,
  });

  // send count immediately to this client
  socket.emit("onlineCount", players.size);

  // broadcast to everyone else
  broadcastOnlineCount();

  /* ---------------- ONLINE COUNT REQUEST ---------------- */

  // client can request current online count (fixes race condition
  // where the event fires before the listener is attached)
  socket.on("getOnlineCount", () => {
    socket.emit("onlineCount", players.size);
  });

  /* ---------------- JOIN GAME ---------------- */

  socket.on("joinGame", ({ game, username }) => {
    const player = players.get(socket.id);
    if (!player) return;
    if (player.roomId) return;

    player.username = username;
    playersByUsername.set(username, player);

    if (!queues[game]) queues[game] = [];

    const queue = queues[game];

    // remove invalid entries
    queues[game] = queue.filter((id) => {
      const p = players.get(id);
      return p && p.roomId === null;
    });

    const waitingPlayerId = queues[game].shift();

    if (waitingPlayerId) {
      const playerA = players.get(waitingPlayerId);
      const playerB = player;

      if (!playerA || playerA.roomId) {
        queues[game].push(socket.id);
        return;
      }

      createRoom(game, playerA, playerB);
    } else {
      queues[game].push(socket.id);
    }
  });

  /* ---------------- RECONNECT GAME ---------------- */

  socket.on("reconnectGame", ({ roomId, username }) => {
    const session = sessions[roomId];
    if (!session) return;

    if (!session.players.includes(username)) return;

    const player = players.get(socket.id);
    if (!player) return;

    player.username = username;
    playersByUsername.set(username, player);
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
      board: session.state.board,
      turn: session.state.turn,
    });
  });

  /* ---------------- MOVE ---------------- */

  socket.on("move", ({ room, index }) => {
    const session = sessions[room];
    if (!session) return;

    const player = players.get(socket.id);
    if (!player) return;

    const playerIndex = session.players.indexOf(player.username);
    if (playerIndex === -1) return;

    if (playerIndex !== session.state.turn) return;

    const gameLogic = games[session.game];

    const resultMove = gameLogic.makeMove(session.state, playerIndex, index);

    if (!resultMove) return;

    const { mark } = resultMove;

    const result = gameLogic.checkWinner(session.state);

    if (result) {
      io.to(room).emit("gameOver", {
        winner: result,
        board: session.state.board,
      });

      if (session.turnTimer) clearTimeout(session.turnTimer);

      return;
    }

    // switch turn
    session.state.turn = session.state.turn === 0 ? 1 : 0;

    io.to(room).emit("move", {
      index,
      mark,
      turn: session.state.turn,
    });

    startTurnTimer(room);
  });

  /* ---------------- REMATCH REQUEST ---------------- */

  socket.on("requestRematch", ({ room }) => {
    const session = sessions[room];
    if (!session) return;

    const player = players.get(socket.id);
    if (!player) return;

    const username = player.username;

    // record that this player wants a rematch
    session.rematchRequests[username] = true;

    const opponentUsername = session.players.find((p) => p !== username);

    // notify opponent that a rematch was requested
    const opponent = getPlayerByUsername(opponentUsername);
    if (opponent) {
      opponent.socket.emit("opponentRematchRequested");
    }

    // if both players requested rematch, reset the game
    if (
      session.rematchRequests[session.players[0]] &&
      session.rematchRequests[session.players[1]]
    ) {
      session.state = games[session.game].createGame();
      session.rematchRequests = {};

      io.to(room).emit("rematchStart", {
        board: session.state.board,
        turn: session.state.turn,
      });

      startTurnTimer(room);
    }
  });

  /* ---------------- TURN TIMEOUT ---------------- */

  socket.on("turnTimeout", ({ room }) => {
    const session = sessions[room];
    if (!session) return;

    const player = players.get(socket.id);
    if (!player) return;

    const playerIndex = session.players.indexOf(player.username);
    if (playerIndex === -1) return;

    // Only allow timeout from the player whose turn it currently is
    if (playerIndex !== session.state.turn) return;

    // switch turn
    session.state.turn = session.state.turn === 0 ? 1 : 0;

    // broadcast new turn to both players
    io.to(room).emit("turnUpdate", {
      turn: session.state.turn,
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
    sessionsBySocket.delete(socket.id);

    if (opponent) {
      opponent.socket.emit("opponentLeft");
      opponent.roomId = null;
    }

    delete sessions[roomId];
  });

  /* ---------------- CREATE PRIVATE ROOM ---------------- */

  socket.on("createRoom", ({ game, username }) => {
    const player = players.get(socket.id);
    if (!player) return;
    if (player.roomId) return;

    player.username = username;
    playersByUsername.set(username, player);

    const roomId = nanoid(6);

    sessions[roomId] = {
      game,
      players: [username],
      state: games[game].createGame(),
      createdAt: Date.now(),
      reconnectTimer: null,
      rematchRequests: {},
    };

    player.roomId = roomId;
    sessionsBySocket.set(socket.id, roomId);

    socket.join(roomId);

    socket.emit("roomCreated", {
      room: roomId,
    });
  });

  /* ---------------- JOIN PRIVATE ROOM ---------------- */

  socket.on("joinRoom", ({ roomId, username }) => {
    const session = sessions[roomId];
    if (!session) return;
    if (!games[session.game]) return;

    if (session.players.length >= 2 || session.players.includes(username))
      return;

    const player = players.get(socket.id);
    if (!player) return;

    player.username = username;
    playersByUsername.set(username, player);
    player.roomId = roomId;
    sessionsBySocket.set(socket.id, roomId);

    session.players.push(username);

    socket.join(roomId);

    const playerA = session.players[0];
    const playerB = session.players[1];

    io.to(roomId).emit("gameStart", {
      room: roomId,
      players: [{ name: playerA }, { name: playerB }],
      board: session.state.board,
      turn: session.state.turn,
    });

    startTurnTimer(roomId);
  });

  /* ---------------- DISCONNECT ---------------- */

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    const player = players.get(socket.id);
    if (!player) return;

    const username = player.username;
    const roomId = player.roomId;
    sessionsBySocket.delete(socket.id);

    if (player.username) {
      playersByUsername.delete(player.username);
    }
    players.delete(socket.id);

    broadcastOnlineCount();

    /* remove from queues */

    Object.keys(queues).forEach((game) => {
      queues[game] = queues[game].filter((id) => id !== socket.id);
    });

    // If player was only waiting in matchmaking (no room), do nothing else
    if (!roomId) {
      return;
    }

    if (sessions[roomId]) {
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
