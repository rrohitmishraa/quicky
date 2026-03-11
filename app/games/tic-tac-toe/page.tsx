import { Suspense } from "react";
import TicTacToe from "./tictactoe";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TicTacToe />
    </Suspense>
  );
}