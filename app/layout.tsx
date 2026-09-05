import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./styles.css";
import "./brand.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
export const metadata: Metadata = { title: "Tax Practitioner Virtual Office", description: "Secure tax-practice operations and authorization control center." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const body = <body className={`${inter.variable} ${display.variable}`}>{children}</body>;
  return <html lang="en">{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ClerkProvider>{body}</ClerkProvider> : body}</html>;
}
