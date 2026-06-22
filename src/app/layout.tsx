import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "AI Nodes - 笔记分析智能体",
  description: "把你的思想可视化，让认知成长看得见",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
        <Sidebar />
        <main className="flex-1 ml-[var(--sidebar-width)] p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
