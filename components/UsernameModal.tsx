"use client";

import { useState } from "react";

export default function UsernameModal({ onSubmit }: any) {
    const [name, setName] = useState("");

    function submit() {
        if (!name.trim()) return;
        onSubmit(name);
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl w-80">

                <h2 className="text-lg font-semibold mb-4 text-center">
                    Enter your username
                </h2>

                <input
                    className="w-full border px-3 py-2 mb-4 bg-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Username"
                />

                <button
                    onClick={submit}
                    className="w-full bg-green-500 py-2 rounded-lg"
                >
                    Continue
                </button>

            </div>

        </div>
    );
}