export function CommentHtml({ html }: { html: string }) {
  return <div className="comment-html" dangerouslySetInnerHTML={{ __html: html }} />;
}
