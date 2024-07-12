"use client";

import { mc } from "@/lib/functions";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

export default function Page() {
    const connectionId = useMemo(() => Math.random().toString(36).slice(2), []);
    const [messages, setMessages] = useState([]);
    const [isConnectionOpen, setIsConnectionOpen] = useState(false);

    const onToggleConnection = useCallback(() => {
        setIsConnectionOpen((isOpen) => !isOpen);
    }, []);

    useEffect(() => {
        if (!isConnectionOpen) return;

        const eventSource = new EventSource(`/sse?connectionId=${connectionId}`);

        eventSource.onopen = () => {
            console.log("[SSE] Connection established");
        };

        eventSource.onmessage = (event) => {
            if (event.data === "OK") {
                console.log("[SSE] Received OK message");
                return;
            }

            setMessages((messages) => [...messages, event.data]);
        };

        eventSource.onerror = (event) => {
            console.error("[SSE] Error:", event);

            if (eventSource.readyState === EventSource.CLOSED) {
                console.log("[SSE] Connection closed because of an error");
                setIsConnectionOpen(false);
            }
        };

        const cleanup = () => {
            console.log("[SSE] Closing connection");
            eventSource.close();
            window.removeEventListener("beforeunload", cleanup);
        };

        window.addEventListener("beforeunload", cleanup);

        return cleanup;
    }, [connectionId, isConnectionOpen]);

    useEffect(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    return (
        <div className="mx-auto flex size-full max-w-screen-md flex-col gap-4 bg-black p-10 text-center text-white">
            <h1 className="text-4xl font-semibold">Here's some unnecessary quotes for you to read... (probably)</h1>

            {messages.map((message, index, elements) => (
                <Fragment key={index}>
                    <p className={mc("duration-200", index + 1 !== elements.length ? "opacity-40" : "scale-105 font-bold")}>{message}</p>
                </Fragment>
            ))}

            {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
            <button className={mc("hover:opacity-75 duration-200 font-bold text-lg", isConnectionOpen ? "text-[#f06b6b]" : "text-[#6bf06b]")} onClick={onToggleConnection}>
                {isConnectionOpen ? "Stop" : "Start"} Quotes
            </button>

            <span className="opacity-50">Connection ID: {connectionId}</span>

            <div className="h-96 w-full" />
        </div>
    );
}
