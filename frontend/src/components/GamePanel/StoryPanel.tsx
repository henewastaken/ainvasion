import { useEffect, useRef } from "react";

interface Props {
    log: string[];
}

export default function StoryPanel({ log }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [log]);

    return (
        <div className="panel story-panel">
            <h3>Story Log</h3>
            {log.length === 0 ? (
                <p className="muted">The chronicles are empty. Make your first move.</p>
            ) : (
                <div className="story-scroll">
                    {log.map((entry: string, index: number) => (
                        <p key={index} className="story-entry">
                            <span className="story-num">#{index + 1}</span> {entry}
                        </p>
                    ))}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
    );
}
