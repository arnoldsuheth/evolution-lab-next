import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./cartoon.css";
import "./cloud.css";
import "./adventure.css";
import {CloudRuntime,CloudGate} from "@/components/CloudAccount";

const base = process.env.GITHUB_PAGES === "true" ? "/evolution-lab-next" : "";

export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#263650"};
export const metadata: Metadata = {
  title: "Lion’s Cave RPG Programador",
  applicationName: "Lion’s Cave RPG Programador",
  icons: { icon: `${base}/lion-emblem.svg`, apple: `${base}/apple-touch-icon.png` },
  manifest: `${base}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "Lion’s Cave", statusBarStyle: "black-translucent" },
  description: "O Código Perdido — aprenda programação explorando Pedra da Aurora.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body><CloudRuntime/>{children}<CloudGate/></body>
    </html>
  );
}
