import { Suspense } from "react";
import Connect4 from "./connect4";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Connect4 />
    </Suspense>
  );
}