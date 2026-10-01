import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://mess-meal-cost.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/join"],
        disallow: [
          "/dashboard",
          "/meals",
          "/expenses",
          "/payments",
          "/settlement",
          "/members",
          "/settings",
          "/months",
          "/reports",
          "/create-mess",
          "/forgot-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
