import {NextResponse} from "next/server";import {governanceDocuments} from "@/lib/governance-registry";
export function GET(){return NextResponse.json({institution:"Ross Tax Pro University of Business, Accounting and Taxation",documents:governanceDocuments,notice:"Draft registry; approval and accreditation status must be independently verified."},{headers:{"Cache-Control":"no-store"}})}
