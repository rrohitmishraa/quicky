import { Suspense } from "react";
import RPS from "./rps";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RPS />
    </Suspense>
  );
}