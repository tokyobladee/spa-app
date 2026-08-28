import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CommentsApi, type CaptchaChallenge, type CreateCommentPayload } from "../../api/commentsApi";
import { createFilePreview, type FilePreview, validateAttachment } from "../../domain/files";
import { validateCommentMarkup } from "../../domain/markup";
import { CommentHtml } from "./CommentHtml";

interface CommentFormProps {
  parentId?: string;
  onSubmit: (payload: CreateCommentPayload) => Promise<void>;
}

const initialForm = {
  userName: "",
  email: "",
  homePage: "",
  captchaValue: "",
  text: ""
};

export function CommentForm({ parentId, onSubmit }: CommentFormProps) {
  const api = useMemo(() => new CommentsApi(), []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState(initialForm);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshCaptcha();
  }, []);

  async function refreshCaptcha() {
    setError(null);

    try {
      setCaptcha(await api.getCaptcha());
      updateField("captchaValue", "");
    } catch (error) {
      setCaptcha(null);
      setError(error instanceof Error ? error.message : "Unable to load CAPTCHA");
    }
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function insertTag(tag: "a" | "code" | "i" | "strong") {
    const textarea = textareaRef.current;
    if (!textarea) {
      const template = tag === "a" ? '<a href="https://" title=""></a>' : `<${tag}></${tag}>`;
      updateField("text", `${form.text}${template}`);
      return;
    }

    const start = textarea.selectionStart ?? form.text.length;
    const end = textarea.selectionEnd ?? form.text.length;
    const selectedText = form.text.substring(start, end);

    let replacement = "";
    let cursorOffset = 0;

    if (tag === "a") {
      if (selectedText) {
        replacement = `<a href="https://" title="${selectedText}">${selectedText}</a>`;
        cursorOffset = 9;
      } else {
        replacement = '<a href="https://" title=""></a>';
        cursorOffset = 9;
      }
    } else {
      replacement = `<${tag}>${selectedText}</${tag}>`;
      cursorOffset = selectedText ? replacement.length : tag.length + 2;
    }

    const nextText = form.text.substring(0, start) + replacement + form.text.substring(end);
    updateField("text", nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }

  async function handleFile(file: File | null) {
    setFileError(null);
    setFilePreview(null);
    setAttachment(null);

    if (!file) {
      return;
    }

    const validationError = validateAttachment(file);

    if (validationError) {
      setFileError(validationError);
      return;
    }

    setAttachment(file);
    setFilePreview(await createFilePreview(file));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!captcha) {
      return;
    }

    const markupError = validateCommentMarkup(form.text);
    if (markupError) {
      setError(markupError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateCommentPayload = {
        userName: form.userName,
        email: form.email,
        captchaId: captcha.id,
        captchaValue: form.captchaValue,
        text: form.text
      };

      if (parentId) {
        payload.parentId = parentId;
      }

      if (form.homePage) {
        payload.homePage = form.homePage;
      }

      if (attachment) {
        payload.attachment = attachment;
      }

      await onSubmit(payload);
      setForm(initialForm);
      setPreviewHtml("");
      setAttachment(null);
      setFilePreview(null);
      await refreshCaptcha();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create comment");
      await refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  async function preview() {
    setError(null);

    const markupError = validateCommentMarkup(form.text);
    if (markupError) {
      setError(markupError);
      setPreviewHtml("");
      return;
    }

    try {
      const result = await api.previewComment(form.text);
      setPreviewHtml(result.sanitizedHtml);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to preview comment");
    }
  }

  return (
    <form className={parentId ? "comment-form compact" : "comment-form"} onSubmit={(event) => void submit(event)}>
      <label className="field">
        User Name
        <input value={form.userName} onChange={(event) => updateField("userName", event.target.value)} pattern="[A-Za-z0-9]+" required />
      </label>
      <label className="field">
        E-mail
        <input value={form.email} onChange={(event) => updateField("email", event.target.value)} type="email" required />
      </label>
      <label className="field">
        Home page
        <input value={form.homePage} onChange={(event) => updateField("homePage", event.target.value)} type="url" />
      </label>
      <label className="field textarea-field">
        Text
        <textarea ref={textareaRef} value={form.text} onChange={(event) => updateField("text", event.target.value)} required rows={5} />
      </label>
      <div className="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => insertTag("i")}>i</button>
        <button type="button" onClick={() => insertTag("strong")}>strong</button>
        <button type="button" onClick={() => insertTag("code")}>code</button>
        <button type="button" onClick={() => insertTag("a")}>a</button>
      </div>
      <label className="field">
        Attachment
        <input type="file" accept=".jpg,.jpeg,.gif,.png,.txt,image/jpeg,image/png,image/gif,text/plain" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
      </label>
      <div className="captcha-field">
        <div className="captcha-heading">
          <span>CAPTCHA</span>
          <button type="button" onClick={() => void refreshCaptcha()}>
            Refresh
          </button>
        </div>
        <div className="captcha-row">
          {captcha ? <div className="captcha" aria-label="CAPTCHA image" dangerouslySetInnerHTML={{ __html: captcha.image }} /> : <div className="captcha captcha-empty">Unavailable</div>}
          <label className="field captcha-input">
            Code
            <input value={form.captchaValue} onChange={(event) => updateField("captchaValue", event.target.value)} pattern="[A-Za-z0-9]+" required />
          </label>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" onClick={() => void preview()}>Preview</button>
        <button type="submit" disabled={submitting}>{submitting ? "Submitting" : "Submit"}</button>
      </div>
      {previewHtml ? <CommentHtml html={previewHtml} /> : null}
      {fileError ? <p className="error-text">{fileError}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {filePreview ? (
        <aside className="file-preview">
          <strong>{filePreview.name}</strong>
          {filePreview.url ? <img src={filePreview.url} alt={filePreview.name} /> : null}
          {filePreview.text ? <pre>{filePreview.text}</pre> : null}
        </aside>
      ) : null}
    </form>
  );
}
