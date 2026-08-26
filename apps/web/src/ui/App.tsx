import { CommentForm } from "../features/comments/CommentForm";
import { CommentsTable } from "../features/comments/CommentsTable";
import { useComments } from "../features/comments/useComments";

export function App() {
  const comments = useComments();

  return (
    <main className="app-shell">
      <section className="comments-board" aria-labelledby="comments-title">
        <header className="comments-header">
          <div>
            <p className="eyebrow">Live threaded discussion</p>
            <h1 id="comments-title">Comments</h1>
          </div>
          <button type="button" className="primary-action" onClick={() => void comments.refresh()}>
            Refresh
          </button>
        </header>

        <CommentForm onSubmit={comments.createComment} />

        {comments.error ? <p className="error-text">{comments.error}</p> : null}

        <CommentsTable
          data={comments.data}
          sortBy={comments.sortBy}
          direction={comments.direction}
          loading={comments.loading}
          onSortByChange={comments.setSortBy}
          onDirectionChange={comments.setDirection}
          onPageChange={comments.setPage}
        />
      </section>
    </main>
  );
}
