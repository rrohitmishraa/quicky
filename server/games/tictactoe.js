const WIN_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function createGame() {
  return {
    board: Array(9).fill(null),
    turn: 0,
  };
}

function makeMove(state, playerIndex, index) {
  if (index < 0 || index > 8) return null;

  if (state.board[index] !== null) return null;

  if (playerIndex !== state.turn) return null;

  const mark = playerIndex === 0 ? "P" : "O";

  state.board[index] = mark;

  return { mark };
}

function checkWinner(state) {
  const board = state.board;

  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (!board.includes(null)) return "draw";

  return null;
}

module.exports = {
  createGame,
  makeMove,
  checkWinner,
};
