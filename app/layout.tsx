import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { MessProvider } from "@/hooks/use-mess";
import { JsonLd } from "@/components/seo/json-ld";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://mess-meal-cost.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "MessCost — Simple Mess হিসাব, Shared by Everyone",
    template: "%s | MessCost",
  },
  description:
    "মেসের হিসাব, সহজেই সবার জন্য। Complete Mess Expense & Daily Meal Management Web Application for students, bachelors, and shared messes in Bangladesh. Track daily meals, bazar expenses, live meal rates, and settlements.",
  keywords: [
    "mess hisab",
    "mess meal calculator",
    "মেসের হিসাব",
    "মিল রেট",
    "mess manager bangladesh",
    "bachelor mess management",
    "hostel meal tracker",
    "bazar expense tracker",
    "mess meal cost",
    "bachelor hisab app",
    "mess hisab software",
    "daily meal sheet bd",
    "mess meal hisab bd",
    "dhaka mess management",
  ],
  authors: [{ name: "MessCost", url: baseUrl }],
  creator: "MessCost",
  publisher: "MessCost",
  applicationName: "MessCost",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD"],
    url: baseUrl,
    siteName: "MessCost",
    title: "MessCost — Simple Mess হিসাব, Shared by Everyone",
    description:
      "মেসের হিসাব, সহজেই সবার জন্য। Daily meal sheet, bazar expense splitting, live meal rate calculation, and instant settlements for messes in Bangladesh.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MessCost — Simple Mess হিসাব, Shared by Everyone",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MessCost — Simple Mess হিসাব, Shared by Everyone",
    description:
      "মেসের হিসাব, সহজেই সবার জন্য। Track daily meals, bazar expenses, live meal rates, and instant settlements.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      >
        <JsonLd />
        <AuthProvider>
          <MessProvider>{children}</MessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
