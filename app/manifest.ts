import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PetFunCR",
    short_name: "PetFunCR",
    description:
      "Sistema de gestión de guardería y hotel PetFunCR",

    start_url: "/",
    display: "standalone",

    background_color: "#15151a",
    theme_color: "#1f1f25",

    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}