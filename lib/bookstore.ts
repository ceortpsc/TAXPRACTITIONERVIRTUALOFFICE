export const bookstoreResources=[
 {sku:"RTPU-TAX101-EPUB",title:"Tax Practice Foundations Coursebook",format:"EPUB 3",access:"Included with course",priceCents:0,license:"Institution-authored; enrolled-student license",courses:["TAX-101"],availability:"draft"},
 {sku:"RTPU-ACC110-PDF",title:"Accounting Cycle Practice Workbook",format:"Accessible PDF",access:"Included with course",priceCents:0,license:"Institution-authored; enrolled-student license",courses:["ACC-110"],availability:"draft"},
 {sku:"OER-ETH120-WEB",title:"Professional Ethics Open Reading List",format:"Web/OER",access:"Free external resources",priceCents:0,license:"License verified per linked source before publication",courses:["ETH-120"],availability:"review_required"},
] as const;
export const bookstoreControls={checkout:"disabled",reason:"Merchant, tax, refund, copyright, accessibility, fulfillment, and payment controls not yet verified",epub:"EPUB 3 accessibility validation required before release",options:["institution-included","open educational resource","publisher-direct","rental where authorized","print-on-demand where authorized"]} as const;
