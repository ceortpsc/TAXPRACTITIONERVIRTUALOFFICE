export type PublicRoute={path:string;title:string;description:string;kind:"page"|"api"|"xml";changeFrequency:"daily"|"weekly"|"monthly";priority:number;operational:boolean};
export const publicRoutes:readonly PublicRoute[]=[
 {path:"/",title:"Tax Practitioner Virtual Office",description:"Public platform overview and authorization posture.",kind:"page",changeFrequency:"weekly",priority:1,operational:false},
 {path:"/refunds",title:"Refund Command Center",description:"Refund lifecycle and trace workflow overview.",kind:"page",changeFrequency:"weekly",priority:.9,operational:true},
 {path:"/casework",title:"Casework and Interventions",description:"TC 570, TC 810, hardship, and refund trace workflow guidance.",kind:"page",changeFrequency:"weekly",priority:.9,operational:true},
 {path:"/master-file",title:"Master File Reconciliation",description:"Account-module reconciliation controls and event checks.",kind:"page",changeFrequency:"weekly",priority:.9,operational:true},
 {path:"/settings",title:"Platform Control Center",description:"Technology, access-control, and automation registry.",kind:"page",changeFrequency:"monthly",priority:.7,operational:true},
 {path:"/route-registry.xml",title:"XML Route Registry",description:"Machine-readable public route and readiness contract.",kind:"xml",changeFrequency:"weekly",priority:.4,operational:false},
 {path:"/api/health",title:"Health API",description:"Non-secret application and integration configuration status.",kind:"api",changeFrequency:"daily",priority:.2,operational:true},
 {path:"/api/authorizations",title:"Authorization Registry API",description:"Masked source-status and internal readiness registry.",kind:"api",changeFrequency:"weekly",priority:.2,operational:true},
] as const;
export function absoluteUrl(path:string){const base=(process.env.APP_URL||"http://localhost:3000").replace(/\/$/,"");return `${base}${path}`;}
