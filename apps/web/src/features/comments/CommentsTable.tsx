import type { CommentAttachment, CommentItem, CommentSortField, PaginatedComments, SortDirection } from "@comments/shared";
import { useMemo, useState } from "react";
import { CommentsApi, type CreateCommentPayload } from "../../api/commentsApi";
import { getAvatarUrl } from "../../domain/avatars";
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

function formatCommentDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} at ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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
      return <span className="sort-icon neutral">sort</span>;
    }
    return <span className="sort-icon active">{direction === "asc" ? "^" : "v"}</span>;
  }

  return (
    <section className="comments-list" aria-busy={loading}>
      <div className="section-heading">
        <div className="heading-title-row">
          <h2>Discussion</h2>
          <span className="comments-count-badge">{data.total} comments</span>
        </div>
        <div className="view-mode-toggle">
          <button
            type="button"
            className={viewMode === "cards" ? "active" : ""}
            onClick={() => setViewMode("cards")}
            title="Card feed view"
          >
            Feed View
          </button>
          <button
            type="button"
            className={viewMode === "table" ? "active" : ""}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            Table View
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <SegmentedControl values={fields} value={sortBy} onChange={onSortByChange} label="Sort by" />
        <SegmentedControl values={directions} value={direction} onChange={onDirectionChange} label="Direction" />
      </div>

      {viewMode === "cards" ? (
        <div className="comments-feed">
          {data.items.length === 0 ? (
            <div className="empty-feed">
              {loading ? "Loading comments..." : "No comments yet. Be the first to leave a comment!"}
            </div>
          ) : (
            data.items.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onCreateReply={onCreateReply}
                onOpenAttachment={(att) => setActiveLightboxAttachment(att)}
              />
            ))
          )}
        </div>
      ) : (
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
                  <CommentTableRow
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
      )}

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

function CommentCard({
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
  const [bookmarked, setBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
  const [userVote, setUserVote] = useState<-1 | 0 | 1>(0);
  const [replies, setReplies] = useState<CommentItem[]>(comment.replies || []);
  const [error, setError] = useState<string | null>(null);

  async function loadReplies() {
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

  function toggleReplies() {
    const next = !expanded;
    setExpanded(next);
    if (next && replies.length === 0 && comment.repliesCount > 0) {
      void loadReplies();
    }
  }

  function handleVote(direction: 1 | -1) {
    if (userVote === direction) {
      setUserVote(0);
      setRating((r) => r - direction);
    } else {
      const diff = userVote === 0 ? direction : direction * 2;
      setUserVote(direction);
      setRating((r) => r + diff);
    }
  }

  function copyPermalink() {
    const url = `${window.location.origin}#comment-${comment.id}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
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

  const avatarUrl = getAvatarUrl(comment.author);

  return (
    <article className="comment-card" id={`comment-${comment.id}`}>
      <div className="card-inner">
        <header className="card-header">
          <div className="card-author-info">
            <img src={avatarUrl} alt={comment.author.userName} className="author-avatar-img" />
            <span className="author-name-text">{comment.author.userName}</span>
            <time className="comment-timestamp">{formatCommentDate(comment.createdAt)}</time>

            <div className="card-actions-icons">
              <button type="button" className="icon-action-btn" title="Copy permalink" onClick={copyPermalink}>
                #
              </button>
              <button
                type="button"
                className={`icon-action-btn ${bookmarked ? "bookmarked" : ""}`}
                title="Bookmark"
                onClick={() => setBookmarked((b) => !b)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button
                type="button"
                className={`icon-action-btn ${replying ? "active" : ""}`}
                title="Reply"
                onClick={() => setReplying((r) => !r)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 14 4 9 9 4"/>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                </svg>
              </button>
              {comment.author.homePage ? (
                <a
                  href={comment.author.homePage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="icon-action-btn"
                  title={`Home page: ${comment.author.homePage}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </a>
              ) : null}
            </div>
          </div>

          <div className="card-rating-control">
            <button
              type="button"
              className={`vote-btn up ${userVote === 1 ? "voted" : ""}`}
              onClick={() => handleVote(1)}
              title="Upvote"
            >
              +
            </button>
            <span className={`rating-score ${rating > 0 ? "positive" : rating < 0 ? "negative" : ""}`}>
              {rating}
            </span>
            <button
              type="button"
              className={`vote-btn down ${userVote === -1 ? "voted" : ""}`}
              onClick={() => handleVote(-1)}
              title="Downvote"
            >
              -
            </button>
          </div>
        </header>

        <div className="card-content-body">
          <CommentHtml html={comment.sanitizedHtml} />
          <Attachments attachments={comment.attachments} onOpenAttachment={onOpenAttachment} />
        </div>

        {comment.repliesCount > 0 ? (
          <div className="card-replies-meta">
            <button type="button" className="thread-toggle-btn" onClick={toggleReplies}>
              {expanded ? "Hide replies" : `Show replies (${comment.repliesCount})`}
            </button>
          </div>
        ) : null}
      </div>

      {replying ? (
        <div className="inline-reply-container">
          <CommentForm
            parentId={comment.id}
            parentUserName={comment.author.userName}
            onSubmit={createReply}
            onCancel={() => setReplying(false)}
          />
        </div>
      ) : null}

      {expanded && (replies.length > 0 || loading || error) ? (
        <div className="card-thread-tree">
          {error ? <p className="error-text">{error}</p> : null}
          {loading ? <p className="loading-replies">Loading replies...</p> : null}
          {replies.map((reply) => (
            <ReplyCardNode
              key={reply.id}
              reply={reply}
              parentUserName={comment.author.userName}
              onCreateReply={onCreateReply}
              onOpenAttachment={onOpenAttachment}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ReplyCardNode({
  reply,
  parentUserName: _parentUserName,
  onCreateReply,
  onOpenAttachment
}: {
  reply: CommentItem;
  parentUserName: string;
  onCreateReply: (payload: CreateCommentPayload) => Promise<void>;
  onOpenAttachment: (attachment: CommentAttachment) => void;
}) {
  const api = useMemo(() => new CommentsApi(), []);
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
  const [userVote, setUserVote] = useState<-1 | 0 | 1>(0);
  const [childReplies, setChildReplies] = useState<CommentItem[]>(reply.replies || []);
  const [error, setError] = useState<string | null>(null);

  function handleVote(direction: 1 | -1) {
    if (userVote === direction) {
      setUserVote(0);
      setRating((r) => r - direction);
    } else {
      const diff = userVote === 0 ? direction : direction * 2;
      setUserVote(direction);
      setRating((r) => r + diff);
    }
  }

  async function loadReplies() {
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

  function toggleReplies() {
    const next = !expanded;
    setExpanded(next);
    if (next && childReplies.length === 0 && reply.repliesCount > 0) {
      void loadReplies();
    }
  }

  function copyPermalink() {
    const url = `${window.location.origin}#comment-${reply.id}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
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

  const avatarUrl = getAvatarUrl(reply.author);

  return (
    <article className="reply-card-node" id={`comment-${reply.id}`}>
      <div className="card-inner">
        <header className="card-header">
          <div className="card-author-info">
            <img src={avatarUrl} alt={reply.author.userName} className="author-avatar-img small" />
            <span className="author-name-text">{reply.author.userName}</span>
            <time className="comment-timestamp">{formatCommentDate(reply.createdAt)}</time>

            <div className="card-actions-icons">
              <button type="button" className="icon-action-btn" title="Copy permalink" onClick={copyPermalink}>
                #
              </button>
              <button
                type="button"
                className={`icon-action-btn ${bookmarked ? "bookmarked" : ""}`}
                title="Bookmark"
                onClick={() => setBookmarked((b) => !b)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button
                type="button"
                className={`icon-action-btn ${replying ? "active" : ""}`}
                title="Reply"
                onClick={() => setReplying((r) => !r)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 14 4 9 9 4"/>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                </svg>
              </button>
              {reply.author.homePage ? (
                <a
                  href={reply.author.homePage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="icon-action-btn"
                  title={`Home page: ${reply.author.homePage}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </a>
              ) : null}
            </div>
          </div>

          <div className="card-rating-control">
            <button
              type="button"
              className={`vote-btn up ${userVote === 1 ? "voted" : ""}`}
              onClick={() => handleVote(1)}
              title="Upvote"
            >
              +
            </button>
            <span className={`rating-score ${rating > 0 ? "positive" : rating < 0 ? "negative" : ""}`}>
              {rating}
            </span>
            <button
              type="button"
              className={`vote-btn down ${userVote === -1 ? "voted" : ""}`}
              onClick={() => handleVote(-1)}
              title="Downvote"
            >
              -
            </button>
          </div>
        </header>

        <div className="card-content-body">
          <CommentHtml html={reply.sanitizedHtml} />
          <Attachments attachments={reply.attachments} onOpenAttachment={onOpenAttachment} />
        </div>

        {reply.repliesCount > 0 ? (
          <div className="card-replies-meta">
            <button type="button" className="thread-toggle-btn" onClick={toggleReplies}>
              {expanded ? "Hide replies" : `Show replies (${reply.repliesCount})`}
            </button>
          </div>
        ) : null}
      </div>

      {replying ? (
        <div className="inline-reply-container">
          <CommentForm
            parentId={reply.id}
            parentUserName={reply.author.userName}
            onSubmit={createReply}
            onCancel={() => setReplying(false)}
          />
        </div>
      ) : null}

      {expanded && (childReplies.length > 0 || loading || error) ? (
        <div className="card-thread-tree nested">
          {error ? <p className="error-text">{error}</p> : null}
          {loading ? <p className="loading-replies">Loading replies...</p> : null}
          {childReplies.map((child) => (
            <ReplyCardNode
              key={child.id}
              reply={child}
              parentUserName={reply.author.userName}
              onCreateReply={onCreateReply}
              onOpenAttachment={onOpenAttachment}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function CommentTableRow({
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

  const avatarUrl = getAvatarUrl(comment.author);

  return (
    <>
      <tr className="comment-main-row">
        <td>
          <div className="author-cell">
            <img src={avatarUrl} alt={comment.author.userName} className="author-avatar-img small" />
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
                  {comment.author.homePage.replace(/^https?:\/\//i, "")}
                </a>
              ) : null}
            </div>
          </div>
        </td>
        <td className="email-cell">{comment.author.email}</td>
        <td className="date-cell">{formatCommentDate(comment.createdAt)}</td>
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
                    <ReplyCardNode
                      key={reply.id}
                      reply={reply}
                      parentUserName={comment.author.userName}
                      onCreateReply={onCreateReply}
                      onOpenAttachment={onOpenAttachment}
                    />
                  ))}
                </div>
              ) : null}
              {replying ? (
                <div className="reply-form-wrapper">
                  <CommentForm
                    parentId={comment.id}
                    parentUserName={comment.author.userName}
                    onSubmit={createReply}
                    onCancel={() => setReplying(false)}
                  />
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
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
                <span className="attachment-label">{attachment.originalName}</span>
              </div>
            ) : (
              <span className="attachment-label">{attachment.originalName}</span>
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
