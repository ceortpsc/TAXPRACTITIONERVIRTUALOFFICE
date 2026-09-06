const forbiddenXml = /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i;

export const XML_MAX_BYTES = 1_048_576;

export function validateXmlInput(body: string, contentType: string | null): void {
  if (!contentType || !/(?:application|text)\/xml/i.test(contentType)) throw new Error("Unsupported XML content type");
  if (Buffer.byteLength(body, "utf8") > XML_MAX_BYTES) throw new Error("XML payload exceeds one MiB");
  if (forbiddenXml.test(body)) throw new Error("DOCTYPE, ENTITY, and external stylesheet declarations are prohibited");
  if (!/^\s*<\?xml\s+version=["']1\.0["']/i.test(body)) throw new Error("XML 1.0 declaration is required");
}

export const secureXmlHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
} as const;
