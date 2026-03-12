"use client";

import { useEffect, useState } from "react";
import UsernameModal from "@/components/UsernameModal";
import { getUsername, setUsername, initUsername } from "@/lib/usernameStore";

export default function UsernameGuard() {
    const [username, setLocalUsername] = useState<string | null>(null);

    useEffect(() => {
        initUsername();
        setLocalUsername(getUsername());
    }, []);

    function handleUsername(name: string) {
        const clean = name.trim();
        if (!clean) return;

        setUsername(clean);
        setLocalUsername(clean);
    }

    if (username) return null;

    return <UsernameModal onSubmit={handleUsername} />;
}