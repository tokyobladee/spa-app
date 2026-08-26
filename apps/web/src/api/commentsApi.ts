import type { CommentItem, CommentSortField, PaginatedComments, SortDirection } from "@comments/shared";

export interface CaptchaChallenge {
  id: string;
  image: string;
}

export interface CreateCommentPayload {
  parentId?: string;
  userName: string;
  email: string;
  homePage?: string;
  captchaId: string;
  captchaValue: string;
  text: string;
  attachment?: File;
}

export interface ListCommentsParams {
  page: number;
  pageSize: number;
  sortBy: CommentSortField;
  direction: SortDirection;
}

export class CommentsApi {
  async getCaptcha(): Promise<CaptchaChallenge> {
    return this.request<CaptchaChallenge>("/api/captcha");
  }

  async listComments(params: ListCommentsParams): Promise<PaginatedComments> {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      sortBy: params.sortBy,
      direction: params.direction
    });

    return this.request<PaginatedComments>(`/api/comments?${search.toString()}`);
  }

  async listReplies(commentId: string): Promise<CommentItem[]> {
    return this.request<CommentItem[]>(`/api/comments/${commentId}/replies`);
  }

  async createComment(payload: CreateCommentPayload): Promise<CommentItem> {
    if (payload.attachment) {
      const body = new FormData();
      body.set("userName", payload.userName);
      body.set("email", payload.email);
      body.set("captchaId", payload.captchaId);
      body.set("captchaValue", payload.captchaValue);
      body.set("text", payload.text);
      body.set("attachment", payload.attachment);

      if (payload.parentId) {
        body.set("parentId", payload.parentId);
      }

      if (payload.homePage) {
        body.set("homePage", payload.homePage);
      }

      return this.request<CommentItem>("/api/comments", {
        method: "POST",
        body
      });
    }

    return this.request<CommentItem>("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  async previewComment(text: string): Promise<{ sanitizedHtml: string }> {
    return this.request<{ sanitizedHtml: string }>("/api/comments/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, init);

    if (!response.ok) {
      const message = await this.getErrorMessage(response);
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  private async getErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { message?: string | string[] };

      return Array.isArray(body.message) ? body.message.join(", ") : body.message ?? "Request failed";
    } catch {
      return "Request failed";
    }
  }
}
