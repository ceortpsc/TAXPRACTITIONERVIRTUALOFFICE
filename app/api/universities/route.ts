import { NextResponse } from "next/server";
import { universities, universityPersonas } from "@/lib/university";
export function GET(){return NextResponse.json({delivery:"100% online",instruction:"AI-assisted with accountable human governance",universities:Object.values(universities),personas:universityPersonas},{headers:{"Cache-Control":"public, max-age=300"}})}
