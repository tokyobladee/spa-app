import type { CommentAttachment, CommentItem, CommentSortField, PaginatedComments, SortDirection } from "@comments/shared";
import { useMemo, useState } from "react";
import { CommentsApi, type CreateCommentPayload } from "../../api/commentsApi";
import { AttachmentLightbox } from "./AttachmentLightbox";
import { CommentForm } from "./CommentForm";
import { CommentHtml } from "./CommentHtml";

interface CommentsTableProps {
  data: PaginatedComments;
  sortBy: CommentSortField;
  direction: SortDirection;
  loading: boolean;
  onSortByChange: (field: CommentSortField) => void;
  onDirectionChange: (direction: SortDirection) => void;
  onPageChange: (page: number) => void;
  onCreateReply: (payload: CreateCommentPayload) => Promise<void>;
}

const fields: CommentSortField[] = ["createdAt", "userName", "email"];
const directions: SortDirection[] = ["desc", "asc"];

export function CommentsTable({
  data,
  sortBy,
  direction,
  loading,
  onSortByChange,
  onDirectionChange,
  onPageChange,
  onCreateReply
}: CommentsTableProps) {
  const [activeLightboxAttachment, setActiveLightboxAttachment] = useState<CommentAttachment | null>(null);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  function handleHeaderSort(field: CommentSortField) {
    if (sortBy === field) {
      onDirectionChange(direction === "asc" ? "desc" : "asc");
    } else {
      onSortByChange(field);
      onDirectionChange("desc");
    }
  }

  function getSortIndicator(field: CommentSortField) {
    if (sortBy !== field) {
      return <span className="sort-icon neutral">⇅</span>;
    }
    return <span className="sort-icon active">{direction === "asc" ? "▲" : "▼"}</span>;
  }

  return (
    <section className="comments-list" aria-busy={loading}>
      <div className="section-heading">
        <h2>Discussion</h2>
      </div>
      <div className="table-toolbar">
        <SegmentedControl values={fields} value={sortBy} onChange={onSortByChange} label="Sort field" />
        <SegmentedControl values={directions} value={direction} onChange={onDirectionChange} label="Direction" />
      </div>

      <div className="table-frame">
        <table>
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleHeaderSort("userName")}>
                <span>User Name {getSortIndicator("userName")}</span>
              </th>
              <th className="sortable-th" onClick={() => handleHeaderSort("email")}>
                <span>E-mail {getSortIndicator("email")}</span>
              </th>
              <th className="sortable-th" onClick={() => handleHeaderSort("createdAt")}>
                <span>Created {getSortIndicator("createdAt")}</span>
              </th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  {loading ? "Loading comments..." : "No comments yet. Be the first to leave a comment!"}
                </td>
              </tr>
            ) : (
              data.items.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  onCreateReply={onCreateReply}
                  onOpenAttachment={(att) => setActiveLightboxAttachment(att)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <nav className="pagination" aria-label="Comment pages">
        <button type="button" disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)}>
          Previous
        </button>
        <span>
          Page {data.page} of {pages}
        </span>
        <button type="button" disabled={data.page >= pages} onClick={() => onPageChange(data.page + 1)}>
          Next
        </button>
      </nav>

      <AttachmentLightbox
        attachment={activeLightboxAttachment}
        onClose={() => setActiveLightboxAttachment(null)}
      />
    </section>
  );
}

function CommentRow({
  comment,
  onCreateReply,
  onOpenAttachment
}: {
  comment: CommentItem;
  onCreateReply: (payload: CreateCommentPayload) => Promise<void>;
  onOpenAttachment: (attachment: CommentAttachment) => void;
}) {
  const api = useMemo(() => new CommentsApi(), []);
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<CommentItem[]>(comment.replies || []);
  const [error, setError] = useState<string | null>(null);

  async function toggleReplies() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (!nextExpanded || replies.length > 0 || comment.repliesCount === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setReplies(await api.listReplies(comment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load replies");
    } finally {
      setLoading(false);
    }
  }

  async function createReply(payload: CreateCommentPayload) {
    await onCreateReply({
      ...payload,
      parentId: comment.id
    });
    setReplying(false);
    setReplies(await api.listReplies(comment.id));
    setExpanded(true);
  }

  return (
    <>
      <tr className="comment-main-row">
        <td>
          <div className="author-cell">
            <div className="author-avatar">{comment.author.userName.charAt(0).toUpperCase()}</div>
            <div className="author-meta">
              <strong>{comment.author.userName}</strong>
              {comment.author.homePage ? (
                <a
                  href={comment.author.homePage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="author-homepage"
                  title={comment.author.homePage}
                >
                  🌐 {comment.author.homePage.replace(/^https?:\/\//i, "")}
                </a>
              ) : null}
            </div>
          </div>
        </td>
        <td className="email-cell">{comment.author.email}</td>
        <td className="date-cell">{new Date(comment.createdAt).toLocaleString()}</td>
        <td className="content-cell">
          <CommentHtml html={comment.sanitizedHtml} />
          <Attachments attachments={comment.attachments} onOpenAttachment={onOpenAttachment} />
        </td>
        <td className="actions-cell">
          <div className="row-actions">
            {comment.repliesCount > 0 ? (
              <button
                type="button"
                className="toggle-replies-btn"
                onClick={() => void toggleReplies()}
              >
                {expanded ? "Hide replies" : `Replies (${comment.repliesCount})`}
              </button>
            ) : null}
            <button
              type="button"
              className={replying ? "reply-btn active" : "reply-btn"}
              onClick={() => setReplying((current) => !current)}
            >
              {replying ? "Cancel" : "Reply"}
            </button>
          </div>
        </td>
      </tr>
      {expanded || replying ? (
        <tr className="thread-row">
          <td colSpan={5}>
            <div className="thread-container">
              {error ? <p className="error-text">{error}</p> : null}
              {loading ? <p className="loading-replies">Loading replies...</p> : null}
              {expanded && replies.length > 0 ? (
                <div className="reply-tree">
                  {replies.map((reply) => (
                    <ReplyNode
                      key={reply.id}
                      reply={reply}
                      onCreateReply={onCreateReply}
                      onOpenAttachment={onOpenAttachment}
                    />
                  ))}
                </div>
              ) : null}
              {replying ? (
                <div className="reply-form-wrapper">
                  <h4>Reply to {comment.author.userName}</h4>
                  <CommentForm parentId={comment.id} onSubmit={createReply} />
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ReplyNode({
  reply,
  onCreateReply,
  onOpenAttachment
}: {
  reply: CommentItem;
  onCreateReply: (payload: CreateCommentPayload) => Promise<void>;
  onOpenAttachment: (attachment: CommentAttachment) => void;
}) {
  const api = useMemo(() => new CommentsApi(), []);
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [childReplies, setChildReplies] = useState<CommentItem[]>(reply.replies || []);
  const [error, setError] = useState<string | null>(null);

  async function toggleReplies() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (!nextExpanded || childReplies.length > 0 || reply.repliesCount === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setChildReplies(await api.listReplies(reply.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load replies");
    } finally {
      setLoading(false);
    }
  }

  async function createReply(payload: CreateCommentPayload) {
    await onCreateReply({
      ...payload,
      parentId: reply.id
    });
    setReplying(false);
    setChildReplies(await api.listReplies(reply.id));
    setExpanded(true);
  }

  return (
    <article className="reply-node">
      <div className="reply-card">
        <header className="reply-header">
          <div className="author-cell">
            <div className="author-avatar small">{reply.author.userName.charAt(0).toUpperCase()}</div>
            <div className="author-meta">
              <strong>{reply.author.userName}</strong>
              {reply.author.homePage ? (
                <a
                  href={reply.author.homePage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="author-homepage"
                  title={reply.author.homePage}
                >
                  🌐 {reply.author.homePage.replace(/^https?:\/\//i, "")}
                </a>
              ) : null}
            </div>
          </div>
          <span className="reply-date">{new Date(reply.createdAt).toLocaleString()}</span>
        </header>

        <div className="reply-body">
          <CommentHtml html={reply.sanitizedHtml} />
          <Attachments attachments={reply.attachments} onOpenAttachment={onOpenAttachment} />
        </div>

        <footer className="reply-actions">
          {reply.repliesCount > 0 ? (
            <button
              type="button"
              className="toggle-replies-btn"
              onClick={() => void toggleReplies()}
            >
              {expanded ? "Hide replies" : `Replies (${reply.repliesCount})`}
            </button>
          ) : null}
          <button
            type="button"
            className={replying ? "reply-btn active" : "reply-btn"}
            onClick={() => setReplying((current) => !current)}
          >
            {replying ? "Cancel" : "Reply"}
          </button>
        </footer>
      </div>

      {expanded || replying ? (
        <div className="reply-children-container">
          {error ? <p className="error-text">{error}</p> : null}
          {loading ? <p className="loading-replies">Loading replies...</p> : null}
          {expanded && childReplies.length > 0 ? (
            <div className="reply-tree nested">
              {childReplies.map((child) => (
                <ReplyNode
                  key={child.id}
                  reply={child}
                  onCreateReply={onCreateReply}
                  onOpenAttachment={onOpenAttachment}
                />
              ))}
            </div>
          ) : null}
          {replying ? (
            <div className="reply-form-wrapper">
              <h4>Reply to {reply.author.userName}</h4>
              <CommentForm parentId={reply.id} onSubmit={createReply} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function Attachments({
  attachments,
  onOpenAttachment
}: {
  attachments: CommentAttachment[];
  onOpenAttachment: (attachment: CommentAttachment) => void;
}) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="attachments-list">
      {attachments.map((attachment) => {
        const isImage = attachment.mimeType.startsWith("image/");
        return (
          <button
            key={attachment.id}
            type="button"
            className={`attachment-badge ${isImage ? "image-badge" : "text-badge"}`}
            onClick={() => onOpenAttachment(attachment)}
            title={`Click to preview ${attachment.originalName}`}
          >
            {isImage ? (
              <div className="thumbnail-wrapper">
                <img src={attachment.url} alt={attachment.originalName} className="thumbnail-img" />
                <span className="attachment-label">🔍 {attachment.originalName}</span>
              </div>
            ) : (
              <span className="attachment-label">📄 {attachment.originalName}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedControlProps<T extends string> {
  values: T[];
  value: T;
  label: string;
  onChange: (value: T) => void;
}

function SegmentedControl<T extends string>({ values, value, label, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="segmented-group">
      <span className="segmented-label">{label}</span>
      <div className="segmented">
        {values.map((item) => (
          <button type="button" key={item} className={item === value ? "active" : ""} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
