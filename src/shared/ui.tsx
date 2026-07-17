import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "./cn";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-zgreen/30 bg-zsurface shadow-glowSoft">
        <img src="/icons/zverts-focus.png" alt="ZverTs" className="h-6 w-6 object-contain" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zgreen/10 to-transparent" />
      </div>
      {!compact && (
        <div>
          <div className="text-sm font-bold tracking-wide text-white">VerT Focus</div>
          <div className="text-[11px] font-medium text-zgreen/90">Learning Protection</div>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("glass rounded-2xl p-5", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-zgreen/10 text-zgreen">
          <Icon size={16} />
        </div>
        <h3 className="m-0 text-sm font-bold text-white">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zgreen px-5 text-sm font-bold text-zbg transition-all duration-200 hover:bg-zhighlight hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
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
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 transition-all duration-200 hover:border-zgreen/40 hover:bg-zgreen/10 hover:text-white active:scale-[0.98]",
        className
      )}
      {...props}
    />
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-all duration-200 hover:border-zgreen/40 hover:bg-zgreen/10 hover:text-zgreen active:scale-95",
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
        "focus-ring min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 transition-colors duration-200 focus:border-zgreen/50 focus:bg-black/40",
        className
      )}
      {...props}
    />
  );
}

export function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors duration-200 hover:bg-white/[0.05]">
      <div className="text-[11px] font-medium uppercase tracking-wider text-white/45">{label}</div>
      <div className={cn("mt-1.5 text-xl font-bold", accent ? "text-zgreen" : "text-white")}>{value}</div>
    </div>
  );
}

export function ProgressBar({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={cn("overflow-hidden rounded-full bg-white/[0.08]", height)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-zgreen via-zgreen to-zhighlight transition-all duration-700 ease-out",
          height
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zgreen/50" />
      )}
      <span className={cn(
        "relative inline-flex h-2.5 w-2.5 rounded-full",
        active ? "bg-zgreen shadow-glowSoft" : "bg-white/20"
      )} />
    </span>
  );
}

export function Divider() {
  return <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />;
}
