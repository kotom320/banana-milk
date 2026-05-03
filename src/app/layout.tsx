import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NavBar } from "@/components/nav-bar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "banana-milk | PUBG 내전 매니저",
  description: "바나나우유를 걸고 싸우는 PUBG 내전 팀 밸런서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${geist.className} min-h-screen bg-background text-foreground`}>
        <TooltipProvider delay={200}>
          <NavBar />
          <main className="container mx-auto px-4 py-8 max-w-5xl">{children}</main>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
