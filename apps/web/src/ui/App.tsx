import type { CommentSortField, SortDirection } from "@comments/shared";

const sortableFields: CommentSortField[] = ["createdAt", "userName", "email"];
const sortDirections: SortDirection[] = ["desc", "asc"];

export function App() {
  return (
    <main className="app-shell">
      <section className="comments-board" aria-labelledby="comments-title">
        <header className="comments-header">
          <div>
            <p className="eyebrow">Live threaded discussion</p>
            <h1 id="comments-title">Comments</h1>
          </div>
          <button type="button" className="primary-action">
            Add comment
          </button>
        </header>

        <form className="comment-form">
          <label>
            User Name
            <input name="userName" pattern="[A-Za-z0-9]+" required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required />
          </label>
          <label>
            Home page
            <input name="homePage" type="url" />
          </label>
          <label>
            Text
            <textarea name="text" required rows={5} />
          </label>
          <div className="toolbar" aria-label="Formatting">
            <button type="button">i</button>
            <button type="button">strong</button>
            <button type="button">code</button>
            <button type="button">a</button>
          </div>
        </form>

        <div className="table-toolbar">
          <div>
            <span>Sort field</span>
            <div className="segmented">
              {sortableFields.map((field) => (
                <button type="button" key={field}>
                  {field}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span>Direction</span>
            <div className="segmented">
              {sortDirections.map((direction) => (
                <button type="button" key={direction}>
                  {direction}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>E-mail</th>
              <th>Created</th>
              <th>Replies</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4}>No comments yet</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
