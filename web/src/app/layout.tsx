import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import { getOrganizationSchema, getWebApplicationSchema, getWebSiteSchema, BASE_URL } from "@/lib/seo/structured-data";
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
    default: "Audio Quality Checker & QC Tool | LUFS, True Peak & Clipping | Sonichecks",
    template: "%s | Sonichecks",
  },
  description: "Check audio quality before delivery with Sonichecks. Analyze LUFS, True Peak, clipping, silence, format and more with deterministic audio QC.",
  keywords: [
    "audio quality checker",
    "audio qc",
    "audio quality control",
    "audio delivery checker",
    "audio file analyzer",
    "audio qc tool",
    "lufs checker",
    "lufs meter",
    "loudness checker",
    "true peak checker",
    "true peak meter",
    "audio clipping checker",
    "wav analyzer",
    "wav quality checker",
    "audio mastering qc",
    "audio delivery specifications",
    "broadcast audio qc",
    "podcast audio checker",
    "audiobook audio checker"
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
    siteName: "Sonichecks",
    title: "Audio Quality Checker & QC Tool | LUFS, True Peak & Clipping | Sonichecks",
    description: "Check audio quality before delivery with Sonichecks. Analyze LUFS, True Peak, clipping, silence, format and more with deterministic audio QC.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Audio Quality Checker & QC Tool | LUFS, True Peak & Clipping | Sonichecks",
    description: "Check audio quality before delivery with Sonichecks. Analyze LUFS, True Peak, clipping, silence, format and more with deterministic audio QC.",
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
  const websiteSchema = getWebSiteSchema();
  const orgSchema = getOrganizationSchema();
  const webAppSchema = getWebApplicationSchema();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
      <head>
        <script
          key="ld-json-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
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
