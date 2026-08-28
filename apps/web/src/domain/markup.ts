const allowedTags = new Set(["a", "code", "i", "strong"]);

export function validateCommentMarkup(text: string): string | null {
  if (!text.trim()) {
    return "Comment text cannot be empty";
  }

  const stack: string[] = [];
  const tags = text.match(/<\/?[^>]+>/g) ?? [];

  for (const rawTag of tags) {
    const normalized = rawTag.toLowerCase();
    const tagName = normalized.match(/^<\/?\s*([a-z0-9]+)/)?.[1];

    if (!tagName || !allowedTags.has(tagName)) {
      return `Unsupported HTML tag <${tagName ?? "unknown"}>. Only <a>, <code>, <i>, and <strong> are allowed.`;
    }

    if (normalized.startsWith("</")) {
      const opened = stack.pop();
      if (opened !== tagName) {
        return `Tag <${opened ?? "unknown"}> was not properly closed or mismatch with </${tagName}>. Code must be valid XHTML.`;
      }
      continue;
    }

    if (!normalized.endsWith("/>")) {
      stack.push(tagName);
    }
  }

  if (stack.length > 0) {
    return `Unclosed tag <${stack[stack.length - 1]}>. Code must be valid XHTML.`;
  }

  return null;
}
