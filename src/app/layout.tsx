import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "RASER – Rubric for Assessing Scientific Experimental Research" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <nav aria-label="Main">
            <Link className="brand" href="/">RASER</Link>
            <Link href="/rubrics">Published rubrics</Link>
            <Link href="/designer">Designer</Link>
            <Link href="/editor">Editor</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
