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
import "./mobile-layout.css";
import "./shop-compact.css";
import "./practice.css";
import "./desktop-hud.css";
import "./lovelace-hud.css";
import "./lovelace-desktop.css";
import "./lovelace-screens.css";
import "./kingdom-visual.css";
import "./lovelace-final.css";
import "./prologue.css";
import {CloudRuntime,CloudGate} from "@/components/CloudAccount";

const base = "";

export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#0B1F3B"};
export const metadata: Metadata = {
  title: "Lovelace Kingdom",
  applicationName: "Lovelace Kingdom",
  icons: { icon: [{url:`${base}/lovelace-icon-192.png`,sizes:"192x192",type:"image/png"}] },
  manifest: `${base}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "Lovelace Kingdom", statusBarStyle: "black-translucent" },
  description: "Explore a Pedra da Aurora, domine as runas da programação e descubra O Legado dos Precursores.",
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


