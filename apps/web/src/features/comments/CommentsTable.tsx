import type { CommentItem, CommentSortField, PaginatedComments, SortDirection } from "@comments/shared";
import { CommentHtml } from "./CommentHtml";

interface CommentsTableProps {
  data: PaginatedComments;
  sortBy: CommentSortField;
  direction: SortDirection;
  loading: boolean;
  onSortByChange: (field: CommentSortField) => void;
  onDirectionChange: (direction: SortDirection) => void;
  onPageChange: (page: number) => void;
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
  onPageChange
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
            data.items.map((comment) => <CommentRow key={comment.id} comment={comment} />)
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

function CommentRow({ comment }: { comment: CommentItem }) {
  return (
    <tr>
      <td>{comment.author.userName}</td>
      <td>{comment.author.email}</td>
      <td>{new Date(comment.createdAt).toLocaleString()}</td>
      <td><CommentHtml html={comment.sanitizedHtml} /></td>
      <td>{comment.repliesCount}</td>
    </tr>
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
