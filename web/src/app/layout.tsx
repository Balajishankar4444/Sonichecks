import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import { getOrganizationSchema, getWebApplicationSchema, BASE_URL } from "@/lib/seo/structured-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Sonichecks — Automated Audio Quality Control & Loudness Checker",
    template: "%s | Sonichecks",
  },
  description: "Automated deterministic audio quality control for loudness (LUFS), True Peak (dBTP), format integrity, digital clipping, silence, and multi-track consistency. 100% local browser DSP compliant with ITU-R BS.1770-4 and EBU R128.",
  keywords: [
    "audio quality control",
    "audio qc",
    "lufs meter online",
    "loudness checker",
    "true peak calculator",
    "wav file validator",
    "clipping detection",
    "ebu r128 broadcast compliance",
    "spotify loudness checker",
    "apple music sound check validator",
    "acx audiobook qc",
    "audio mastering checker",
    "audio compliance report",
    "sha256 audio certificate"
  ],
  authors: [{ name: "Sonichecks Audio Engineering Team" }],
  creator: "Sonichecks",
  publisher: "Sonichecks",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Sonichecks Audio QC",
    title: "Sonichecks — Automated Audio Quality Control & Loudness Checker",
    description: "Inspect audio files locally in your browser for LUFS, True Peak, Clipping, and multi-track consistency with instant cryptographic PASS/FAIL PDF reports.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sonichecks — Automated Audio Quality Control & Loudness Checker",
    description: "Deterministic in-browser audio signal processing. Check loudness, true peak, and clipping instantly.",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = getOrganizationSchema();
  const webAppSchema = getWebApplicationSchema();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
      <head>
        <script
          key="ld-json-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          key="ld-json-webapp"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
