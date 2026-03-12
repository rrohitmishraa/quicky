"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export default function ClientInitializer() {
    useEffect(() => {
        const socket = getSocket();

        // request current online count after connection
        const requestCount = () => {
            socket.emit("getOnlineCount");
        };

        if (socket.connected) {
            requestCount();
        } else {
            socket.once("connect", requestCount);
        }
    }, []);

    return null;
}