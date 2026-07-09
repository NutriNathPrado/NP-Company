import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Nath Prado Studio",
  description: "Criador de carrosséis da Nath Company — nutrição esportiva e fitness feminino",
  applicationName: "Nath Studio",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/icon-32.png",
  },
  appleWebApp: {
    capable: true,
    title: "Nath Studio",
    statusBarStyle: "black-translucent",
  },
};

const themeInitScript = `
(() => {
  try {
    const mode = localStorage.getItem("np-theme-mode") || "system";
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.theme = mode === "system" ? (dark ? "dark" : "light") : mode;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
