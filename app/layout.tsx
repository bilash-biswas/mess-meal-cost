import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { MessProvider } from "@/hooks/use-mess";

export const metadata: Metadata = {
  title: "MessCost — Simple Mess হিসাব, Shared by Everyone",
  description:
    "মেসের হিসাব, সহজেই সবার জন্য। Complete Mess Expense Management Web Application for students, bachelors, and shared messes in Bangladesh.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
        <AuthProvider>
          <MessProvider>{children}</MessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
