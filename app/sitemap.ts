import type {MetadataRoute} from "next";import {absoluteUrl,publicRoutes} from "@/lib/public-routes";
export default function sitemap():MetadataRoute.Sitemap{return publicRoutes.filter(r=>r.kind==="page").map(r=>({url:absoluteUrl(r.path),lastModified:new Date("2026-09-05T00:00:00Z"),changeFrequency:r.changeFrequency,priority:r.priority}));}
