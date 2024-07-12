"use client";

import { mc } from "@/lib/functions";

import { Fragment, useCallback, useEffect, useState } from "react";

export default function Page() {
    const [messages, setMessages] = useState([]);
    const [isConnectionOpen, setIsConnectionOpen] = useState(false);

    const onToggleConnection = useCallback(() => {
        setIsConnectionOpen((isOpen) => !isOpen);
    }, []);

    useEffect(() => {
        if (!isConnectionOpen) return;

        const eventSource = new EventSource("/sse");

        eventSource.onopen = () => {
            console.log("Connection established");
        };

        eventSource.onmessage = (event) => {
            if (event.data === "OK") {
                console.log("Received OK message");
                return;
            }

            setMessages((messages) => [...messages, event.data]);
        };

        eventSource.onerror = (error) => {
            console.error("Error:", error);
        };

        return () => {
            console.log("Closing connection");
            eventSource.close();
        };
    }, [isConnectionOpen]);

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
            <button className={mc("hover:opacity-75 duration-200", isConnectionOpen ? "text-[#f06b6b]" : "text-[#6bf06b]")} onClick={onToggleConnection}>
                {isConnectionOpen ? "Stop" : "Start"} Quotes
            </button>

            <div className="h-96 w-full" />
        </div>
    );
}
