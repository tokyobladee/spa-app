export type SortDirection = "asc" | "desc";

export type CommentSortField = "createdAt" | "email" | "userName";

export interface CommentAuthor {
  id: string;
  userName: string;
  email: string;
  homePage: string | null;
}

export interface CommentAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
}

export interface CommentItem {
  id: string;
  parentId: string | null;
  author: CommentAuthor;
  sanitizedHtml: string;
  createdAt: string;
  repliesCount: number;
  attachments: CommentAttachment[];
  replies: CommentItem[];
}

export interface PaginatedComments {
  items: CommentItem[];
  page: number;
  pageSize: number;
  total: number;
}
