import { NextResponse } from "next/server";
import { releaseReadiness } from "@/lib/academic-operations";
export function GET(){return NextResponse.json(releaseReadiness(),{headers:{"Cache-Control":"no-store"}})}
