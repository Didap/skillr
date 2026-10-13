import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skillr",
    short_name: "Skillr",
    description: "Match di lavoro trasparenti: budget in chiaro, swipe, call di 30 minuti.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FDFDFC",
    theme_color: "#FDFDFC",
    lang: "it",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
