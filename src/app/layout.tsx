import "@/styles/globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Unnecessary Quotes",
    description: "What do you expect to find here?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="h-full w-full min-h-dvh bg-black">{children}</body>
        </html>
    );
}
