import {NextResponse} from "next/server";
export const runtime="nodejs";
export function GET(){return NextResponse.json({status:"ok",service:"tax-practitioner-virtual-office",checks:{application:"ready",database:process.env.DATABASE_URL?"configured":"not_configured",identity:process.env.AUTH_SECRET?"configured":"not_configured",irsApi:process.env.IRS_CLIENT_ID?"configured":"not_configured",stripe:process.env.STRIPE_SECRET_KEY?"configured":"not_configured"}},{headers:{"Cache-Control":"no-store"}})}
