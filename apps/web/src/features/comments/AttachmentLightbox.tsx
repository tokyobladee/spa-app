import { useEffect, useState } from "react";
import type { CommentAttachment } from "@comments/shared";

interface AttachmentLightboxProps {
  attachment: CommentAttachment | null;
  onClose: () => void;
}

export function AttachmentLightbox({ attachment, onClose }: AttachmentLightboxProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment) {
      setTextContent(null);
      setTextError(null);
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    if (attachment.mimeType.startsWith("text/")) {
      setLoadingText(true);
      setTextError(null);
      fetch(attachment.url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load text file: ${response.statusText}`);
          }
          return response.text();
        })
        .then((text) => {
          setTextContent(text);
        })
        .catch((error) => {
          setTextError(error instanceof Error ? error.message : "Unable to load text file");
        })
        .finally(() => {
          setLoadingText(false);
        });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [attachment, onClose]);

  if (!attachment) {
    return null;
  }

  const isImage = attachment.mimeType.startsWith("image/");
  const formattedSize =
    attachment.sizeBytes < 1024
      ? `${attachment.sizeBytes} B`
      : `${(attachment.sizeBytes / 1024).toFixed(1)} KB`;

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Attachment: ${attachment.originalName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="lightbox-content">
        <header className="lightbox-header">
          <div className="lightbox-title">
            <strong>{attachment.originalName}</strong>
            <span className="lightbox-meta">
              {formattedSize}
              {attachment.width && attachment.height
                ? ` • ${attachment.width}×${attachment.height} px`
                : null}
            </span>
          </div>
          <div className="lightbox-actions">
            <a
              href={attachment.url}
              download={attachment.originalName}
              target="_blank"
              rel="noreferrer"
              className="lightbox-download-btn"
            >
              Download
            </a>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={onClose}
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="lightbox-body">
          {isImage ? (
            <div className="lightbox-image-wrapper">
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="lightbox-image"
              />
            </div>
          ) : (
            <div className="lightbox-text-wrapper">
              {loadingText ? (
                <div className="lightbox-loading">Loading text preview...</div>
              ) : textError ? (
                <div className="error-text">{textError}</div>
              ) : (
                <pre className="lightbox-text-content">{textContent}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
