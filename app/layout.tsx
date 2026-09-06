import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./styles.css";
import "./brand.css";
import "./support.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
export const metadata: Metadata = { metadataBase:new URL(process.env.APP_URL||"https://rosstaxsoftware.com"), title:{default:"Tax Practitioner Virtual Office",template:"%s | Ross Tax Pro Software Co."}, description:"Secure tax-practice operations and authorization control center.", manifest:"/manifest.webmanifest", icons:{icon:[{url:"/favicon.svg",type:"image/svg+xml"},{url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"}],apple:[{url:"/icons/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]} };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ClerkProvider>{children}</ClerkProvider>
    : children;
  return <html lang="en"><body className={`${inter.variable} ${display.variable}`}>{content}<Analytics /></body></html>;
}
