const rules: ReadonlyArray<[RegExp, string]> = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi, "[REDACTED_PRIVATE_KEY]"],
  [/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_-]+\b/g, "[REDACTED_API_KEY]"],
  [/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED_TOKEN]"],
  [/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****"],
  [/\b\d{2}-\d{7}\b/g, "**-*******"],
  [/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_ACCOUNT_NUMBER]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g, "[REDACTED_PHONE]"],
];

const sensitiveKeys = /(?:password|secret|token|authorization|cookie|tin|ssn|ein|email|phone|account|routing|private.?key|certificate)/i;

export function redactText(value: string): string {
  return rules.reduce((output, [pattern, replacement]) => output.replace(pattern, replacement), value);
}

export function redact<T>(value: T): T {
  if (typeof value === "string") return redactText(value) as T;
  if (Array.isArray(value)) return value.map(redact) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.test(key) ? "[REDACTED]" : redact(entry),
    ])) as T;
  }
  return value;
}
