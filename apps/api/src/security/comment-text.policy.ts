import { BadRequestException, Injectable } from "@nestjs/common";

const allowedTags = new Set(["a", "code", "i", "strong"]);

@Injectable()
export class CommentTextPolicy {
  sanitize(input: string): string {
    this.assertAllowedMarkup(input);

    const sanitized = input.replace(/<\/?[^>]+>/g, (tag) => this.normalizeTag(tag)).trim();

    if (!sanitized) {
      throw new BadRequestException("Comment text cannot be empty");
    }

    return sanitized;
  }

  toPlainText(input: string): string {
    return input.replace(/<[^>]*>/g, "").trim();
  }

  private assertAllowedMarkup(input: string) {
    const stack: string[] = [];
    const tags = input.match(/<\/?[^>]+>/g) ?? [];

    for (const rawTag of tags) {
      const normalized = rawTag.toLowerCase();
      const tagName = normalized.match(/^<\/?\s*([a-z0-9]+)/)?.[1];

      if (!tagName || !allowedTags.has(tagName)) {
        throw new BadRequestException("Comment text contains unsupported HTML");
      }

      if (normalized.startsWith("</")) {
        const opened = stack.pop();

        if (opened !== tagName) {
          throw new BadRequestException("Comment HTML tags must be properly closed");
        }

        continue;
      }

      if (!normalized.endsWith("/>")) {
        stack.push(tagName);
      }
    }

    if (stack.length > 0) {
      throw new BadRequestException("Comment HTML tags must be properly closed");
    }
  }

  private normalizeTag(rawTag: string): string {
    const normalized = rawTag.toLowerCase();
    const tagName = normalized.match(/^<\/?\s*([a-z0-9]+)/)?.[1];

    if (!tagName || !allowedTags.has(tagName)) {
      throw new BadRequestException("Comment text contains unsupported HTML");
    }

    if (normalized.startsWith("</")) {
      return `</${tagName}>`;
    }

    if (tagName !== "a") {
      return `<${tagName}>`;
    }

    const attributes = this.getSafeAnchorAttributes(rawTag);

    return attributes.length > 0 ? `<a ${attributes.join(" ")}>` : "<a>";
  }

  private getSafeAnchorAttributes(rawTag: string): string[] {
    const attributes: string[] = [];
    const matches = rawTag.matchAll(/\s(href|title)\s*=\s*(["'])(.*?)\2/gi);

    for (const match of matches) {
      const name = match[1]?.toLowerCase();
      const value = match[3] ?? "";

      if (name === "href" && this.isSafeUrl(value)) {
        attributes.push(`href="${this.escapeAttribute(value)}"`);
      }

      if (name === "title") {
        attributes.push(`title="${this.escapeAttribute(value)}"`);
      }
    }

    return attributes;
  }

  private isSafeUrl(value: string): boolean {
    try {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
