"use client";

type Props = {
    roomLink: string | null;
    roomCode: string | null;
    multiplayer: boolean;
    copied: boolean;
    setCopied: (v: boolean) => void;
    effectiveRoomLink: string | null;
    hasPrivateRoom: boolean;
    isCreator?: boolean;
    createRoom: () => void;
    leaveMatch: () => void;
};

export default function RoomLobby({
    roomLink,
    roomCode,
    multiplayer,
    copied,
    setCopied,
    effectiveRoomLink,
    hasPrivateRoom,
    isCreator = false,
    createRoom,
    leaveMatch,
}: Props) {

    // If player is not in a private room show create button
    if (!hasPrivateRoom) {
        return (
            <button
                onClick={createRoom}
                className="mb-4 px-4 py-2 bg-blue-500 text-black rounded"
            >
                Create Private Room
            </button>
        );
    }

    // If player joined someone else's room, show waiting state but no invite tools
    if (!isCreator) {
        if (multiplayer) return null;

        return (
            <div className="mb-4 text-center">
                <p className="text-sm text-zinc-500">Joined Private Room</p>

                <div className="mt-2 text-lg font-semibold tracking-widest">
                    {roomCode}
                </div>

                <p className="text-xs text-zinc-500 mt-2">
                    Waiting for the host to start the game...
                </p>
            </div>
        );
    }

    // If game already started hide lobby
    if (multiplayer) return null;

    return (
        <div className="mb-4 text-center">
            <p className="text-sm text-zinc-500">Private Room Created</p>

            <div className="mt-2 text-lg font-semibold tracking-widest">
                {roomCode}
            </div>

            <div className="flex gap-2 mt-3 justify-center">
                <button
                    onClick={() => {
                        if (effectiveRoomLink)
                            navigator.clipboard.writeText(effectiveRoomLink);

                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-4 py-1 bg-green-500 rounded"
                >
                    Copy Invite Link
                </button>
            </div>

            {copied && (
                <p className="text-xs text-green-500 mt-2">
                    Invite link copied!
                </p>
            )}

            <p className="text-xs text-zinc-500 mt-2">
                Waiting for a friend to join...
            </p>

            <button
                onClick={leaveMatch}
                className="mt-3 px-4 py-1 bg-yellow-500 text-black rounded"
            >
                Find Random Opponent Instead
            </button>
        </div>
    );
}
