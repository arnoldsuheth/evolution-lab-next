import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./cartoon.css";
import "./cloud.css";
import "./adventure.css";
import "./item-icons.css";
import "./compact-hud.css";
import "./combat-ui.css";
import "./interface-refinement.css";
import "./code-world.css";
import "./panel-tech.css";
import {CloudRuntime,CloudGate} from "@/components/CloudAccount";

const base = process.env.GITHUB_PAGES === "true" ? "/evolution-lab-next" : "";

export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#263650"};
export const metadata: Metadata = {
  title: "Lion’s Cave RPG Programador",
  applicationName: "Lion’s Cave RPG Programador",
  icons: { icon: [{url:`${base}/lion-emblem.svg?v=20261106`,type:"image/svg+xml"},{url:`${base}/lion-icon-192.png?v=20261106`,sizes:"192x192",type:"image/png"}], apple: [{url:`${base}/apple-touch-icon.png?v=20261106`,sizes:"180x180",type:"image/png"}] },
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


