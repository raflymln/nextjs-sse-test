import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const responseStream = new TransformStream();
    const encoder = new TextEncoder();
    const writer = responseStream.writable.getWriter();
    let isStreamClosed = false;

    const sendStreamData = (data: string | object) => {
        if (isStreamClosed) return;

        try {
            const dataString = typeof data === "string" ? data : JSON.stringify(data);
            writer.write(encoder.encode(`data: ${dataString}\n\n`));
            console.info(`Sending data to client...`);
        } catch (error) {
            console.error(`Error sending event:`, error);
        }
    };

    const closeStream = async () => {
        if (isStreamClosed) return;
        isStreamClosed = true;

        try {
            await writer.close();

            console.info(`Client disconnected`);
        } catch (error) {
            // Suppress the error if it's about the stream already being closed
            if (error instanceof Error && error.name === "TypeError" && error.message.includes("WritableStream is closed")) return;

            console.error(`Error closing writer:`, error);
        }
    };

    try {
        sendStreamData("OK");

        console.log(`Client connected`);

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
