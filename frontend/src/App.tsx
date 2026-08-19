import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import type { SessionCredentials } from "./types/game";

const SESSION_KEY = "world_domination_session";

export default function App() {
    const [session, setSession] = useState<SessionCredentials | null>(() => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? (JSON.parse(raw) as SessionCredentials) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (session) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }, [session]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LobbyPage onSession={setSession} />} />
                <Route path="/game/:gameId" element={<GamePage session={session} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
