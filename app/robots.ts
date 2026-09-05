import type {MetadataRoute} from "next";import {absoluteUrl} from "@/lib/public-routes";
export default function robots():MetadataRoute.Robots{return{rules:[{userAgent:"*",allow:["/","/refunds","/casework","/master-file"],disallow:["/api/","/settings"]}],sitemap:absoluteUrl("/sitemap.xml")};}
