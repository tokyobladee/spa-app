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
  const captchaInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshCaptcha(true);
  }, []);

  async function refreshCaptcha(clearError = false) {
    if (clearError) {
      setError(null);
    }

    try {
      setCaptcha(await api.getCaptcha());
      updateField("captchaValue", "");
    } catch (err) {
      setCaptcha(null);
      setError(err instanceof Error ? err.message : "Unable to load CAPTCHA");
    }
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setError(null);
    setSuccessMessage(null);
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
      setError("CAPTCHA is not ready. Please click Refresh.");
      return;
    }

    if (!form.captchaValue.trim()) {
      setError("Please enter the CAPTCHA code from the image.");
      captchaInputRef.current?.focus();
      return;
    }

    const markupError = validateCommentMarkup(form.text);
    if (markupError) {
      setError(markupError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: CreateCommentPayload = {
        userName: form.userName.trim(),
        email: form.email.trim(),
        captchaId: captcha.id,
        captchaValue: form.captchaValue.trim(),
        text: form.text.trim()
      };

      if (parentId) {
        payload.parentId = parentId;
      }

      if (form.homePage?.trim()) {
        payload.homePage = form.homePage.trim();
      }

      if (attachment) {
        payload.attachment = attachment;
      }

      await onSubmit(payload);
      setForm(initialForm);
      setPreviewHtml("");
      setAttachment(null);
      setFilePreview(null);
      setSuccessMessage(parentId ? "Reply published successfully!" : "Comment published successfully!");
      await refreshCaptcha(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unable to create comment";
      setError(errMsg);
      await refreshCaptcha(false);
      if (errMsg.toLowerCase().includes("captcha")) {
        captchaInputRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function preview() {
    setError(null);
    setSuccessMessage(null);

    const markupError = validateCommentMarkup(form.text);
    if (markupError) {
      setError(markupError);
      setPreviewHtml("");
      return;
    }

    try {
      const result = await api.previewComment(form.text);
      setPreviewHtml(result.sanitizedHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview comment");
    }
  }

  return (
    <form className={parentId ? "comment-form compact" : "comment-form"} onSubmit={(event) => void submit(event)}>
      <label className="field">
        User Name *
        <input
          value={form.userName}
          onChange={(event) => updateField("userName", event.target.value)}
          pattern="[A-Za-z0-9]+"
          placeholder="latin letters and digits only"
          required
        />
      </label>
      <label className="field">
        E-mail *
        <input
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          type="email"
          placeholder="name@example.com"
          required
        />
      </label>
      <label className="field">
        Home page
        <input
          value={form.homePage}
          onChange={(event) => updateField("homePage", event.target.value)}
          type="url"
          placeholder="http://example.com"
        />
      </label>
      <label className="field textarea-field">
        Text *
        <textarea
          ref={textareaRef}
          value={form.text}
          onChange={(event) => updateField("text", event.target.value)}
          placeholder="Write your comment here..."
          required
          rows={5}
        />
      </label>
      <div className="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => insertTag("i")} title="Italic [i]">
          [i]
        </button>
        <button type="button" onClick={() => insertTag("strong")} title="Bold [strong]">
          [strong]
        </button>
        <button type="button" onClick={() => insertTag("code")} title="Code [code]">
          [code]
        </button>
        <button type="button" onClick={() => insertTag("a")} title="Link [a]">
          [a]
        </button>
      </div>
      <label className="field">
        Attachment
        <input
          type="file"
          accept=".jpg,.jpeg,.gif,.png,.txt,image/jpeg,image/png,image/gif,text/plain"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="captcha-field">
        <div className="captcha-heading">
          <span>CAPTCHA *</span>
          <button type="button" onClick={() => void refreshCaptcha(true)} title="Get new CAPTCHA image">
            🔄 Refresh
          </button>
        </div>
        <div className="captcha-row">
          {captcha ? (
            <div className="captcha" aria-label="CAPTCHA image" dangerouslySetInnerHTML={{ __html: captcha.image }} />
          ) : (
            <div className="captcha captcha-empty">Unavailable</div>
          )}
          <label className="field captcha-input">
            Code *
            <input
              ref={captchaInputRef}
              value={form.captchaValue}
              onChange={(event) => updateField("captchaValue", event.target.value)}
              placeholder="Enter symbols above"
              pattern="[A-Za-z0-9]+"
              required
            />
          </label>
        </div>
      </div>

      {error ? (
        <div className="form-alert error-alert" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-message">{error}</div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="form-alert success-alert" role="status">
          <span className="alert-icon">✓</span>
          <div className="alert-message">{successMessage}</div>
        </div>
      ) : null}

      {fileError ? <p className="error-text">{fileError}</p> : null}

      <div className="form-actions">
        <button type="button" onClick={() => void preview()}>
          Preview
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : parentId ? "Submit Reply" : "Submit Comment"}
        </button>
      </div>

      {previewHtml ? (
        <div className="preview-container">
          <div className="preview-header">
            <strong>Preview</strong>
          </div>
          <CommentHtml html={previewHtml} />
        </div>
      ) : null}

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
