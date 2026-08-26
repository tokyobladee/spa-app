import type { CommentItem, CommentSortField, PaginatedComments, SortDirection } from "@comments/shared";
import { useMemo, useState } from "react";
import { CommentsApi, type CreateCommentPayload } from "../../api/commentsApi";
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
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <section className="comments-list" aria-busy={loading}>
      <div className="table-toolbar">
        <SegmentedControl values={fields} value={sortBy} onChange={onSortByChange} label="Sort field" />
        <SegmentedControl values={directions} value={direction} onChange={onDirectionChange} label="Direction" />
      </div>

      <table>
        <thead>
          <tr>
            <th>User Name</th>
            <th>E-mail</th>
            <th>Created</th>
            <th>Comment</th>
            <th>Replies</th>
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={5}>{loading ? "Loading comments" : "No comments yet"}</td>
            </tr>
          ) : (
            data.items.map((comment) => (
              <CommentRow key={comment.id} comment={comment} onCreateReply={onCreateReply} />
            ))
          )}
        </tbody>
      </table>

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
    </section>
  );
}

function CommentRow({
  comment,
  onCreateReply
}: {
  comment: CommentItem;
  onCreateReply: (payload: CreateCommentPayload) => Promise<void>;
}) {
  const api = useMemo(() => new CommentsApi(), []);
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<CommentItem[]>(comment.replies);
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load replies");
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
      <tr>
        <td>{comment.author.userName}</td>
      <td>{comment.author.email}</td>
      <td>{new Date(comment.createdAt).toLocaleString()}</td>
      <td>
        <CommentHtml html={comment.sanitizedHtml} />
        <Attachments comment={comment} />
      </td>
      <td>
          <div className="row-actions">
            <button type="button" onClick={() => void toggleReplies()}>
              {expanded ? "Hide" : `Show ${comment.repliesCount}`}
            </button>
            <button type="button" onClick={() => setReplying((current) => !current)}>
              Reply
            </button>
          </div>
        </td>
      </tr>
      {expanded || replying ? (
        <tr className="thread-row">
          <td colSpan={5}>
            {error ? <p className="error-text">{error}</p> : null}
            {loading ? <p>Loading replies</p> : null}
            {expanded && replies.length > 0 ? (
              <div className="reply-list">
                {replies.map((reply) => (
                  <article className="reply-item" key={reply.id}>
                    <div>
                      <strong>{reply.author.userName}</strong>
                      <span>{new Date(reply.createdAt).toLocaleString()}</span>
                    </div>
                    <CommentHtml html={reply.sanitizedHtml} />
                    <Attachments comment={reply} />
                  </article>
                ))}
              </div>
            ) : null}
            {replying ? <CommentForm parentId={comment.id} onSubmit={createReply} /> : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Attachments({ comment }: { comment: CommentItem }) {
  if (comment.attachments.length === 0) {
    return null;
  }

  return (
    <div className="attachments">
      {comment.attachments.map((attachment) => (
        <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer">
          {attachment.originalName}
        </a>
      ))}
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
    <div>
      <span>{label}</span>
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
