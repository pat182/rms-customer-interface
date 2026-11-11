import { useEffect, useRef } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!isConfirming) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-message"
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          onCancel();
        }
      }}
      className="fixed left-1/2 top-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-orange-100 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/50"
    >
      <div className="p-6">
        <h2 id="confirmation-modal-title" className="text-lg font-bold">
          {title}
        </h2>
        <p id="confirmation-modal-message" className="mt-2 text-sm text-stone-600">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            disabled={isConfirming}
            onClick={onCancel}
            className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {isConfirming ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
