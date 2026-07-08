import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "./cn";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg border border-zgreen/40 bg-zsurface shadow-glow">
        <span className="text-lg font-black text-zhighlight">Z</span>
      </div>
      {!compact && (
        <div>
          <div className="text-sm font-black tracking-normal text-zwhite">ZverTs Focus</div>
          <div className="text-[11px] font-medium text-zgreen">Learning protection</div>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn("glass rounded-lg p-4", className)}>{children}</section>;
}

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-zgreen px-4 text-sm font-bold text-zbg transition hover:bg-zhighlight disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function GhostButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-zgreen/50 hover:bg-zgreen/10",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/35",
        className
      )}
      {...props}
    />
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[11px] font-medium text-white/55">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-zgreen to-zhighlight" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
