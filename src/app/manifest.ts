import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casulo",
    short_name: "Casulo",
    description: "Gestão financeira familiar",
    start_url: "/",
    display: "standalone",
    background_color: "#1e1b4b",
    theme_color: "#1e1b4b",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
