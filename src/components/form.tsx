"use client";

import { useFormStatus } from "react-dom";

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-cream placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const labelClass = "mb-2 block text-sm font-semibold text-cream";

export function SubmitButton({
  children,
  pendingChildren,
  className,
}: {
  children: React.ReactNode;
  pendingChildren?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-full rounded-lg bg-accent px-4 py-3 font-semibold text-cream transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? (pendingChildren ?? "Un attimo…") : children}
    </button>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-danger">{message}</p>;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}
