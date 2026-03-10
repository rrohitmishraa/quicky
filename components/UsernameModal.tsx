"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function UsernameModal({ onSubmit }: any) {
  const [name, setName] = useState("");

  function submit() {
    if (!name.trim()) return;
    onSubmit(name);
  }

  return (
    <Modal
      title="Enter your username"
      actions={
        <button
          onClick={submit}
          className="w-full bg-green-500 py-2 rounded-lg"
        >
          Continue
        </button>
      }
    >
      <input
        className="w-full border px-3 py-2 bg-transparent"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Username"
      />
    </Modal>
  );
}
