type Player = {
  id: string;
  username: string;
};

export function getPlayer(): Player {
  const stored = localStorage.getItem("player");

  if (stored) return JSON.parse(stored);

  const username =
    prompt("Enter your username") ||
    "Player-" + Math.floor(Math.random() * 1000);

  const player = {
    id: "temp_" + Math.random().toString(36).slice(2, 9),
    username,
  };

  localStorage.setItem("player", JSON.stringify(player));

  return player;
}
