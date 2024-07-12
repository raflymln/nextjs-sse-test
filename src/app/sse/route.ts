import type { NextRequest } from "next/server";

import { PHASE_PRODUCTION_BUILD } from "next/constants";

export async function GET(request: NextRequest) {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return new Response(null, { status: 204 });
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
        return new Response("Connection ID is required", { status: 400 });
    }

    const responseStream = new TransformStream();
    const encoder = new TextEncoder();
    const writer = responseStream.writable.getWriter();
    let isStreamClosed = false;

    const sendStreamData = (data: string | object) => {
        if (isStreamClosed) return;

        try {
            const dataString = typeof data === "string" ? data : JSON.stringify(data);
            writer.write(encoder.encode(`data: ${dataString}\n\n`));
            console.info(`[SSE] Sending data to client...`, { connectionId });
        } catch (error) {
            console.error(`[SSE] Error sending event:`, { connectionId, error });
        }
    };

    const closeStream = async () => {
        if (isStreamClosed) return;
        isStreamClosed = true;

        try {
            await writer.close();
            console.info(`[SSE] Client disconnected`, { connectionId });
        } catch (error) {
            // Suppress the error if it's about the stream already being closed
            if (error instanceof Error && error.name === "TypeError" && error.message.includes("WritableStream is closed")) return;
            console.error(`[SSE] Error closing writer:`, { connectionId, error });
        }
    };

    try {
        sendStreamData("OK");

        console.log(`[SSE] Client connected`, { connectionId });

        const getData = async () => {
            const response = await fetch("https://some-random-api.com/animu/quote");

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const data = await response.json();
            return data.sentence;
        };

        const initialData = await getData();
        sendStreamData(initialData);

        // Send data to the client every 5 seconds
        const interval = setInterval(async () => {
            if (isStreamClosed) {
                clearInterval(interval);
                return;
            }

            const data = await getData();
            sendStreamData(data);
        }, 3000);

        request.signal.onabort = async () => {
            console.log(`[SSE] Abort signal received from client`, { connectionId });
            await closeStream();
            return new Response(null, { status: 204 });
        };

        return new Response(responseStream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        await closeStream();
        return new Response("Internal Server Error", { status: 500 });
    }
}

// WTF Next.js? Why when i only use GET method, this route is not registered as API route?
// This error/bugs only can be found in production build with Dockerfile
// ----------------------------------------
// To reproduce, delete/comment this POST method and build the image and run the container
// Then try to access the route, it will throw an error mentioning 204 Response constructor error
export async function POST() {
    return new Response("Method Not Allowed", { status: 405 });
}
