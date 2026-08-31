export interface CommentAuthorResponse {
  id: string;
  userName: string;
  email: string;
  homePage: string | null;
  avatarUrl: string | null;
}

export interface CommentAttachmentResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
}

export interface CommentResponse {
  id: string;
  parentId: string | null;
  author: CommentAuthorResponse;
  sanitizedHtml: string;
  createdAt: string;
  repliesCount: number;
  attachments: CommentAttachmentResponse[];
  replies: CommentResponse[];
}

export interface PaginatedCommentsResponse {
  items: CommentResponse[];
  page: number;
  pageSize: number;
  total: number;
}
