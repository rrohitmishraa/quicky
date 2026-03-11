import { Suspense } from "react";
import Wordle from "./wordle";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Wordle />
    </Suspense>
  );
}