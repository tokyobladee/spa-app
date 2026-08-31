import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const commentCreateDuration = new Trend("comment_create_duration");
const apiBaseUrl = __ENV.API_BASE_URL || "http://localhost:3000";
const smokeMode = __ENV.K6_SMOKE === "true";

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 400));

export const options = smokeMode ? {
  scenarios: {
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "20s"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
    comment_create_duration: ["p(95)<1200"]
  }
} : {
  scenarios: {
    dailyTrafficShape: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: "2m", target: 25 },
        { duration: "5m", target: 75 },
        { duration: "2m", target: 25 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
    comment_create_duration: ["p(95)<700"]
  }
};

export default function () {
  const captcha = http.get(`${apiBaseUrl}/api/captcha`);

  check(captcha, {
    "captcha created": (response) => response.status === 200
  });

  const challenge = captcha.json();
  const payload = JSON.stringify({
    userName: `User${__VU}${__ITER}`,
    email: `user${__VU}-${__ITER}@example.com`,
    homePage: "https://example.com",
    captchaId: challenge.id,
    captchaValue: __ENV.K6_CAPTCHA_VALUE || "invalid",
    text: "<strong>Hello</strong> from load test"
  });
  const startedAt = Date.now();
  const created = http.post(`${apiBaseUrl}/api/comments`, payload, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  commentCreateDuration.add(Date.now() - startedAt);

  check(created, {
    "comment request handled": (response) => response.status === 201 || response.status === 400
  });

  const listed = http.get(`${apiBaseUrl}/api/comments?page=1&pageSize=25&sortBy=createdAt&direction=desc`);

  check(listed, {
    "comments listed": (response) => response.status === 200
  });

  sleep(1);
}
