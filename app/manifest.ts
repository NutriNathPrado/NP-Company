import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nath Prado Studio",
    short_name: "Nath Studio",
    description: "Criador de carrosséis da Nath Company.",
    start_url: "/hoje",
    scope: "/",
    display: "standalone",
    background_color: "#0e0e11",
    theme_color: "#F01E79",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
