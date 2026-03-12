"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export default function ClientInitializer() {
    useEffect(() => {
        getSocket(); // forces socket connection globally
    }, []);

    return null;
}