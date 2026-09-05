const required=["DATABASE_URL","AUTH_SECRET"];
const production=["IRS_CLIENT_ID","IRS_CLIENT_SECRET","IRS_REDIRECT_URI","STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET"];
const missing=required.filter(k=>!process.env[k]);const prodMissing=production.filter(k=>!process.env[k]);
const report={runtime:process.version,environment:process.env.VERCEL_ENV??process.env.NODE_ENV??"local",required:{ok:missing.length===0,missing},productionIntegrations:{ok:prodMissing.length===0,missing:prodMissing}};
console.log(JSON.stringify(report,null,2));if(missing.length)process.exitCode=1;if(report.environment==="production"&&prodMissing.length)process.exitCode=1;
