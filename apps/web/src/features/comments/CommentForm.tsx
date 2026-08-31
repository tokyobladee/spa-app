import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CommentsApi, type CaptchaChallenge, type CreateCommentPayload } from "../../api/commentsApi";
import { AVATAR_PRESETS, getAvatarUrl } from "../../domain/avatars";
import { createFilePreview, type FilePreview, validateAttachment } from "../../domain/files";
import { validateCommentMarkup } from "../../domain/markup";
import { CommentHtml } from "./CommentHtml";

interface CommentFormProps {
  parentId?: string;
  parentUserName?: string;
  initialQuote?: string;
  onSubmit: (payload: CreateCommentPayload) => Promise<void>;
  onCancel?: () => void;
}

interface FieldErrors {
  userName?: string;
  email?: string;
  homePage?: string;
  avatarUrl?: string;
  text?: string;
  captchaValue?: string;
}

const initialForm = {
  userName: "",
  email: "",
  homePage: "",
  avatarUrl: "",
  captchaValue: "",
  text: ""
};

export function CommentForm({ parentId, parentUserName, initialQuote, onSubmit, onCancel }: CommentFormProps) {
  const api = useMemo(() => new CommentsApi(), []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const captchaInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    text: initialQuote ? `<i>${initialQuote}</i>\n` : ""
  }));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshCaptcha(true);
  }, []);

  async function refreshCaptcha(clearError = false) {
    if (clearError) {
      setError(null);
      setFieldErrors((curr) => {
        const next = { ...curr };
        delete next.captchaValue;
        return next;
      });
    }

    try {
      setCaptcha(await api.getCaptcha());
      setForm((curr) => ({ ...curr, captchaValue: "" }));
    } catch (err) {
      setCaptcha(null);
      setError(err instanceof Error ? err.message : "Unable to load CAPTCHA");
    }
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setError(null);
    setSuccessMessage(null);
    setFieldErrors((curr) => {
      const next = { ...curr };
      delete next[field];
      return next;
    });
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function selectAvatar(url: string) {
    updateField("avatarUrl", url);
    setShowAvatarPicker(false);
  }

  const currentAvatarPreview = useMemo(() => {
    return getAvatarUrl({
      id: "preview",
      userName: form.userName || "Guest",
      email: form.email,
      homePage: form.homePage,
      avatarUrl: form.avatarUrl || null
    });
  }, [form.userName, form.email, form.homePage, form.avatarUrl]);

  function validateClientSide(): FieldErrors {
    const errors: FieldErrors = {};

    const trimmedUser = form.userName.trim();
    if (!trimmedUser) {
      errors.userName = "User Name is required";
    } else if (!/^[A-Za-z0-9]+$/.test(trimmedUser)) {
      errors.userName = "Latin letters and digits only";
    } else if (trimmedUser.length > 64) {
      errors.userName = "Max 64 characters allowed";
    }

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      errors.email = "E-mail is required";
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmedEmail)) {
      errors.email = "Invalid email format (e.g. name@example.com)";
    }

    const trimmedHome = form.homePage.trim();
    if (trimmedHome) {
      try {
        const parsedUrl = new URL(trimmedHome);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          errors.homePage = "Must start with http:// or https://";
        }
      } catch {
        errors.homePage = "Invalid URL (e.g. https://example.com)";
      }
    }

    const markupError = validateCommentMarkup(form.text);
    if (markupError) {
      errors.text = markupError;
    }

    const trimmedCaptcha = form.captchaValue.trim();
    if (!trimmedCaptcha) {
      errors.captchaValue = "Code is required";
    } else if (!/^[A-Za-z0-9]+$/.test(trimmedCaptcha)) {
      errors.captchaValue = "Letters and digits only";
    }

    return errors;
  }

  function parseServerErrors(errorMessage: string): FieldErrors {
    const errors: FieldErrors = {};
    const lower = errorMessage.toLowerCase();

    if (lower.includes("email")) {
      errors.email = "Invalid email address";
    }
    if (lower.includes("username") || lower.includes("user_name")) {
      errors.userName = "Only Latin letters and digits allowed";
    }
    if (lower.includes("homepage") || lower.includes("home_page") || lower.includes("url")) {
      errors.homePage = "Invalid URL address";
    }
    if (lower.includes("captcha")) {
      errors.captchaValue = "Incorrect CAPTCHA code";
    }
    if (lower.includes("markup") || lower.includes("tag") || lower.includes("xhtml") || lower.includes("text")) {
      errors.text = errorMessage;
    }

    return errors;
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

    const validationErrors = validateClientSide();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please correct the highlighted fields above.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});
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

      if (form.avatarUrl?.trim()) {
        payload.avatarUrl = form.avatarUrl.trim();
      }

      if (attachment) {
        payload.attachment = attachment;
      }

      await onSubmit(payload);
      setForm(initialForm);
      setPreviewHtml("");
      setAttachment(null);
      setFilePreview(null);
      setFieldErrors({});
      setSuccessMessage(parentId ? "Reply published successfully!" : "Comment published successfully!");
      await refreshCaptcha(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unable to create comment";
      setError(errMsg);
      setFieldErrors(parseServerErrors(errMsg));
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
      setFieldErrors((curr) => ({ ...curr, text: markupError }));
      setError(markupError);
      setPreviewHtml("");
      return;
    }

    setFieldErrors((curr) => {
      const next = { ...curr };
      delete next.text;
      return next;
    });

    try {
      const result = await api.previewComment(form.text);
      setPreviewHtml(result.sanitizedHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview comment");
    }
  }

  return (
    <form className={parentId ? "comment-form compact" : "comment-form"} onSubmit={(event) => void submit(event)} noValidate>
      <div className="form-avatar-section">
        <div className="avatar-preview-box">
          <img src={currentAvatarPreview} alt="Your Avatar" className="current-avatar-img" />
          <button
            type="button"
            className="choose-avatar-btn"
            onClick={() => setShowAvatarPicker((v) => !v)}
          >
            {showAvatarPicker ? "Close Avatars" : "Choose Avatar"}
          </button>
        </div>

        {showAvatarPicker ? (
          <div className="avatar-picker-grid">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`avatar-preset-btn ${form.avatarUrl === preset.url ? "active" : ""}`}
                onClick={() => selectAvatar(preset.url)}
                title={preset.name}
              >
                <img src={preset.url} alt={preset.name} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="field">
        <div className="field-header">
          <label htmlFor={`user-${parentId ?? "root"}`} className="field-label">User Name *</label>
          {fieldErrors.userName ? <span className="field-error-badge">! {fieldErrors.userName}</span> : null}
        </div>
        <input
          id={`user-${parentId ?? "root"}`}
          className={fieldErrors.userName ? "input-invalid" : ""}
          value={form.userName}
          onChange={(event) => updateField("userName", event.target.value)}
          placeholder="latin letters and digits only"
          required
        />
      </div>

      <div className="field">
        <div className="field-header">
          <label htmlFor={`email-${parentId ?? "root"}`} className="field-label">E-mail *</label>
          {fieldErrors.email ? <span className="field-error-badge">! {fieldErrors.email}</span> : null}
        </div>
        <input
          id={`email-${parentId ?? "root"}`}
          className={fieldErrors.email ? "input-invalid" : ""}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          type="email"
          placeholder="name@example.com"
          required
        />
      </div>

      <div className="field">
        <div className="field-header">
          <label htmlFor={`home-${parentId ?? "root"}`} className="field-label">Home page</label>
          {fieldErrors.homePage ? <span className="field-error-badge">! {fieldErrors.homePage}</span> : null}
        </div>
        <input
          id={`home-${parentId ?? "root"}`}
          className={fieldErrors.homePage ? "input-invalid" : ""}
          value={form.homePage}
          onChange={(event) => updateField("homePage", event.target.value)}
          type="url"
          placeholder="http://example.com"
        />
      </div>

      <div className="captcha-field">
        <div className="captcha-heading">
          <span className="field-label">CAPTCHA *</span>
          <button type="button" onClick={() => void refreshCaptcha(true)} title="Get new CAPTCHA image">
            Refresh
          </button>
        </div>
        <div className="captcha-row">
          {captcha ? (
            <div className="captcha" aria-label="CAPTCHA image" dangerouslySetInnerHTML={{ __html: captcha.image }} />
          ) : (
            <div className="captcha captcha-empty">Unavailable</div>
          )}
          <div className="field captcha-input">
            <div className="field-header">
              <label htmlFor={`captcha-input-${parentId ?? "root"}`} className="field-label">Code *</label>
              {fieldErrors.captchaValue ? (
                <span className="field-error-badge">! {fieldErrors.captchaValue}</span>
              ) : null}
            </div>
            <input
              id={`captcha-input-${parentId ?? "root"}`}
              ref={captchaInputRef}
              className={fieldErrors.captchaValue ? "input-invalid" : ""}
              value={form.captchaValue}
              onChange={(event) => updateField("captchaValue", event.target.value)}
              placeholder="Enter symbols above"
              pattern="[A-Za-z0-9]+"
              required
            />
          </div>
        </div>
      </div>

      <div className="field textarea-field">
        <div className="field-header">
          <label htmlFor={`text-${parentId ?? "root"}`} className="field-label">
            {parentUserName ? `Reply to ${parentUserName} *` : "Text *"}
          </label>
          {fieldErrors.text ? <span className="field-error-badge">! {fieldErrors.text}</span> : null}
        </div>
        <textarea
          id={`text-${parentId ?? "root"}`}
          ref={textareaRef}
          className={fieldErrors.text ? "input-invalid" : ""}
          value={form.text}
          onChange={(event) => updateField("text", event.target.value)}
          placeholder="Write your comment here..."
          required
          rows={5}
        />
      </div>

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

      <div className="field">
        <div className="field-header">
          <label htmlFor={`attachment-${parentId ?? "root"}`} className="field-label">Attachment</label>
          {fileError ? <span className="field-error-badge">! {fileError}</span> : null}
        </div>
        <input
          id={`attachment-${parentId ?? "root"}`}
          type="file"
          accept=".jpg,.jpeg,.gif,.png,.txt,image/jpeg,image/png,image/gif,text/plain"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
      </div>

      {error ? (
        <div className="form-alert error-alert" role="alert">
          <span className="alert-icon">!</span>
          <div className="alert-message">{error}</div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="form-alert success-alert" role="status">
          <span className="alert-icon">OK</span>
          <div className="alert-message">{successMessage}</div>
        </div>
      ) : null}

      <div className="form-actions">
        <button type="button" onClick={() => void preview()}>
          Preview
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : parentId ? "Submit Reply" : "Submit Comment"}
        </button>
        {onCancel ? (
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
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
