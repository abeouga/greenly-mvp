import { useEffect, useId, useRef } from "react";
import { UiIcon } from "./UiIcon";

export function GardenCardMenu({
  name,
  open,
  disabled,
  onToggle,
  onClose,
  onCopy,
  onDelete,
}) {
  const container = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    function closeOutside(event) {
      if (!container.current?.contains(event.target)) onClose();
    }
    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      trigger.current?.focus();
      onClose();
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);
  function select(action) {
    trigger.current?.focus();
    onClose();
    action();
  }
  return (
    <div
      ref={container}
      className="garden-options"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose();
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="icon-button garden-options-trigger"
        aria-label={`${name}のオプション`}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={onToggle}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div
          id={panelId}
          className="garden-options-panel"
          role="group"
          aria-label={`${name}の操作`}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => select(onCopy)}
          >
            <UiIcon name="copy" />
            複製
          </button>
          <button
            type="button"
            className="garden-options-delete"
            disabled={disabled}
            onClick={() => select(onDelete)}
          >
            <UiIcon name="trash" />
            削除
          </button>
        </div>
      )}
    </div>
  );
}
