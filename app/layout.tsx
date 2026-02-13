import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmailHub - 智能多邮件管理平台",
  description: "统一管理所有邮箱，实时推送重要消息到微信、飞书、Telegram",
  keywords: "邮件管理,邮箱监控,实时推送,企业微信,飞书,Telegram,邮件过滤",
  authors: [{ name: "EmailHub Team" }],
  openGraph: {
    title: "EmailHub - 智能多邮件管理平台",
    description: "统一管理所有邮箱，实时推送重要消息",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmailHub - 智能多邮件管理平台",
    description: "统一管理所有邮箱，实时推送重要消息",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
