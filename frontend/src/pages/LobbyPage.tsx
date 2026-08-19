import { useState } from "react";
import CreateGame from "../components/Lobby/CreateGame";
import JoinGame from "../components/Lobby/JoinGame";
import type { SessionCredentials } from "../types/game";

interface Props {
    onSession: (creds: SessionCredentials) => void;
}

export default function LobbyPage({ onSession }: Props) {
    const [tab, setTab] = useState<"create" | "join">("create");

    return (
        <div className="lobby-page">
            <h1>World Domination</h1>
            <div className="tab-bar">
                <button
                    className={tab === "create" ? "active" : ""}
                    onClick={() => setTab("create")}
                >
                    Create Game
                </button>
                <button
                    className={tab === "join" ? "active" : ""}
                    onClick={() => setTab("join")}
                >
                    Join Game
                </button>
            </div>

            {tab === "create" ? (
                <CreateGame onSession={onSession} />
            ) : (
                <JoinGame onSession={onSession} />
            )}
        </div>
    );
}
