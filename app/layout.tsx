import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./styles.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
export const metadata: Metadata = { title: "Tax Practitioner Virtual Office", description: "Secure tax-practice operations and authorization control center." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${inter.variable} ${display.variable}`}>{children}</body></html>; }
