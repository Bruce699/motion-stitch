import { useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { presentError } from "../core/error-presentation";
import { Icon } from "./icons";

export function ErrorIndicator({
  error,
  onRetry,
  onDismiss,
  onOpen,
}: {
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const summaryId = useId();
  useEffect(() => {
    if (!error) setOpen(false);
  }, [error]);
  const presentation = error ? presentError(error) : null;
  function finish(action: () => void) {
    // Acknowledging removes the trigger; keep keyboard focus in the toolbar.
    const buttons = Array.from(
      trigger.current?.parentElement?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ) ?? [],
    );
    const index = buttons.indexOf(trigger.current!);
    const fallback = buttons[index + 1] ?? buttons[index - 1];
    setOpen(false);
    action();
    requestAnimationFrame(() => fallback?.focus());
  }
  return (
    <>
      <span className="visually-hidden" role="status" aria-live="polite">
        {presentation
          ? `${presentation.title}. Error details available in the toolbar.`
          : ""}
      </span>
      {presentation && (
        <Popover.Root
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) onOpen();
          }}
        >
          <Popover.Trigger asChild>
            <button
              ref={trigger}
              className="ui-button icon-button error-indicator"
              aria-label="Show error"
              title={presentation.title}
              data-transport-keys="ignore"
            >
              <Icon name="warning" size={18} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              ref={content}
              className="tilt-ui ui-popover error-popover"
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={8}
              aria-labelledby={titleId}
              aria-describedby={presentation.summary ? summaryId : undefined}
              data-transport-keys="ignore"
              tabIndex={-1}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                content.current?.focus();
              }}
            >
              <div className="error-heading">
                <h2 id={titleId}>{presentation.title}</h2>
                <Popover.Close
                  className="ui-button icon-button"
                  data-variant="ghost"
                  aria-label="Close error details"
                >
                  <Icon name="close" />
                </Popover.Close>
              </div>
              {presentation.summary && (
                <p id={summaryId} className="error-summary">
                  {presentation.summary}
                </p>
              )}
              <details className="error-details">
                <summary>Technical details</summary>
                <pre tabIndex={0}>{presentation.details}</pre>
              </details>
              <div className="error-actions">
                <button
                  className="ui-button"
                  data-variant="ghost"
                  onClick={() => finish(onDismiss)}
                >
                  Dismiss
                </button>
                <button className="ui-button" onClick={() => finish(onRetry)}>
                  Retry
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </>
  );
}
