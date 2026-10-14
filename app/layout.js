import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import UserHeader from "@/components/user-header";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CarLens",
  description: "Find your dream vehicle",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <Suspense fallback={<Header />}><UserHeader /></Suspense>
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />
          {/* <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made by Kartik Prakash</p>
            </div>
          </footer> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
