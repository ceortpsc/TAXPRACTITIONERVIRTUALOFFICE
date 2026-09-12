import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import ClerkRuntimeProvider from "./ClerkRuntimeProvider";
import "./styles.css";
import "./brand.css";
import "./support.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://rosstaxsoftware.com"),
  title: {
    default: "Ross Tax Pro Software Co. | Tax Practitioner Virtual Office",
    template: "%s | Ross Tax Pro Software Co.",
  },
  description: "Secure tax-practice operations, education, payroll, document intelligence, and governed digital guidance.",
  applicationName: "Ross Tax Pro Software Co. Virtual Office",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
  openGraph: {
    type: "website",
    siteName: "Ross Tax Pro Software Co.",
    title: "Ross Tax Pro Software Co. | Tax Practitioner Virtual Office",
    description: "Tax intelligence, professional operations, learning, payroll, and secure virtual-office support.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ross Tax Pro Software Co.",
    description: "Taxes. People. Technology.",
  },
};

export const viewport: Viewport = {
  themeColor: "#071a32",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable}`}>
        <ClerkRuntimeProvider>{children}</ClerkRuntimeProvider>
      </body>
    </html>
  );
}
