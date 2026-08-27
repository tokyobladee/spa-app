import { createHash, randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api";
const elasticsearchUrl = process.env.E2E_ELASTICSEARCH_URL ?? "http://localhost:9200";
const captchaValue = "A2B3C4";
const emailSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const createdCommentIds = [];
const createdEmails = [];
const createdAuthEmails = [];
const createdCaptchaIds = [];
const createdSearchIds = [];

const database = await mysql.createConnection({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "comments",
  password: process.env.DATABASE_PASSWORD ?? "comments",
  database: process.env.DATABASE_NAME ?? "comments_spa"
});

try {
  await expectJson("/health", { status: 200 });
  await expectJson("/auth/me", { status: 401 });

  const adminEmail = `admin-${emailSuffix}@example.com`;
  const adminPassword = "securePassword12";
  const bootstrap = await postJson("/auth/bootstrap-admin", {
    email: adminEmail,
    password: adminPassword,
    bootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN ?? "local-bootstrap-token"
  });
  createdAuthEmails.push(adminEmail);

  assert(bootstrap.accessToken, "Bootstrap should return an access token");
  assertEqual(bootstrap.user.email, adminEmail, "Bootstrap should return the created admin");

  const login = await postJson("/auth/login", {
    email: adminEmail,
    password: adminPassword
  });
  assert(login.accessToken, "Login should return an access token");

  const me = await expectJson("/auth/me", {
    status: 200,
    headers: {
      Authorization: `Bearer ${login.accessToken}`
    }
  });
  assertEqual(me.email, adminEmail, "Protected profile endpoint should read the JWT identity");

  const preview = await postJson("/comments/preview", {
    text: "<strong>Hello</strong> <i>world</i>"
  });
  assertEqual(preview.sanitizedHtml, "<strong>Hello</strong> <i>world</i>", "Allowed HTML should survive preview");

  await expectJson("/comments/preview", {
    method: "POST",
    status: 400,
    body: { text: "<strong>Hello</strong><script>alert(1)</script>" }
  });

  const topCaptchaId = await seedCaptcha(captchaValue);
  const topComment = await postComment({
    captchaId: topCaptchaId,
    captchaValue,
    userName: "Alice123",
    email: `alice-${emailSuffix}@example.com`,
    homePage: "https://example.com",
    text: "<strong>Docker smoke comment</strong>",
    attachment: new Blob(["attachment text"], { type: "text/plain" }),
    attachmentName: "note.txt"
  });
  createdCommentIds.push(topComment.id);
  createdEmails.push(topComment.author.email);

  assertEqual(topComment.author.userName, "Alice123", "Created comment should expose the author");
  assertEqual(topComment.attachments.length, 1, "Created comment should include the text attachment");
  assertEqual(topComment.attachments[0].originalName, "note.txt", "Attachment metadata should keep original name");
  createdSearchIds.push(topComment.id);
  const indexedTopComment = await waitForSearchDocument(topComment.id);
  assertEqual(indexedTopComment._source.authorName, "Alice123", "Search document should include the author name");

  const attachmentResponse = await fetch(`${apiBaseUrl}${topComment.attachments[0].url.replace("/api", "")}`);
  assertEqual(attachmentResponse.status, 200, "Attachment download should return 200");
  assert(
    attachmentResponse.headers.get("content-type")?.includes("text/plain"),
    "Attachment download should keep the text/plain content type"
  );

  const replyCaptchaId = await seedCaptcha(captchaValue);
  const reply = await postComment({
    parentId: topComment.id,
    captchaId: replyCaptchaId,
    captchaValue,
    userName: "Bob123",
    email: `bob-${emailSuffix}@example.com`,
    text: "<i>Nested reply</i>"
  });
  createdCommentIds.push(reply.id);
  createdEmails.push(reply.author.email);

  assertEqual(reply.parentId, topComment.id, "Reply should keep parentId");

  const replies = await expectJson(`/comments/${topComment.id}/replies`, { status: 200 });
  assert(replies.some((item) => item.id === reply.id), "Replies endpoint should include the created reply");

  const page = await expectJson("/comments?page=1&pageSize=25&sortBy=createdAt&direction=desc", { status: 200 });
  assert(page.items.some((item) => item.id === topComment.id), "Top-level listing should include the created comment");
  assert(!page.items.some((item) => item.id === reply.id), "Top-level listing should not include replies");

  console.log("E2E smoke passed");
} finally {
  await cleanup();
  await database.end();
}

async function seedCaptcha(value) {
  const id = randomUUID();
  createdCaptchaIds.push(id);

  await database.execute(
    `INSERT INTO captcha_challenges
      (id, challenge_hash, ip_address, user_agent, expires_at, consumed_at, created_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(6), INTERVAL 10 MINUTE), NULL, NOW(6))`,
    [id, hashCaptcha(value), "127.0.0.1", "e2e-smoke"]
  );

  return id;
}

async function postComment(input) {
  const form = new FormData();
  const { attachment, attachmentName, ...fields } = input;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      form.append(key, String(value));
    }
  }

  if (attachment) {
    form.append("attachment", attachment, attachmentName);
  }

  return expectJson("/comments", {
    method: "POST",
    status: 201,
    body: form
  });
}

async function postJson(path, body) {
  return expectJson(path, {
    method: "POST",
    status: 201,
    body
  });
}

async function expectJson(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, requestOptions(options));
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  assertEqual(response.status, options.status ?? 200, `${options.method ?? "GET"} ${path} should return expected status`);

  return payload;
}

function requestOptions(options) {
  if (!options.body) {
    return {
      method: options.method ?? "GET",
      headers: options.headers
    };
  }

  if (options.body instanceof FormData) {
    return {
      method: options.method ?? "POST",
      headers: options.headers,
      body: options.body
    };
  }

  return {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    body: JSON.stringify(options.body)
  };
}

async function cleanup() {
  if (createdCommentIds.length > 0) {
    await database.query("DELETE FROM comments WHERE id IN (?)", [createdCommentIds]);
  }

  if (createdEmails.length > 0) {
    await database.query("DELETE FROM users WHERE email IN (?)", [createdEmails]);
  }

  if (createdAuthEmails.length > 0) {
    await database.query("DELETE FROM auth_users WHERE email IN (?)", [createdAuthEmails]);
  }

  if (createdCaptchaIds.length > 0) {
    await database.query("DELETE FROM captcha_challenges WHERE id IN (?)", [createdCaptchaIds]);
  }

  await Promise.all(
    createdSearchIds.map((id) =>
      fetch(`${elasticsearchUrl}/comments/_doc/${id}`, {
        method: "DELETE"
      }).catch(() => undefined)
    )
  );
}

function hashCaptcha(value) {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

async function waitForSearchDocument(commentId) {
  const deadline = Date.now() + 10000;
  let lastStatus = 0;

  while (Date.now() < deadline) {
    const response = await fetch(`${elasticsearchUrl}/comments/_doc/${commentId}`);
    lastStatus = response.status;

    if (response.status === 200) {
      return response.json();
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Search document ${commentId} was not indexed in time. Last status: ${lastStatus}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${expected}, got ${actual}`);
  }
}
