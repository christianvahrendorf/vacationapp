import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Destination Finder der Familie Meyer",
    short_name: "Destination Finder",
    description: "Urlaubsziele vorschlagen und gemeinsam abstimmen",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16181d",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
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
