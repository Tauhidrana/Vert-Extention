import "../styles/global.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, ShieldCheck, Bot } from "lucide-react";
import { Button, Logo } from "../shared/ui";

function FocusPage() {
  const [blockedUrl, setBlockedUrl] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setBlockedUrl(params.get("url") ?? "");
    setReason(params.get("reason") ?? "");
  }, []);

  const isAI = reason === "ai_tool_blocked";
  const isYoutubeTimeout = reason === "youtube_timeout";

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-zgreen/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-zhighlight/5 blur-[120px]" />
      </div>

      <section className="relative z-10 w-full max-w-lg animate-scale-in">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="glassStatic rounded-3xl p-10 text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl border border-zgreen/30 bg-zgreen/10 shadow-glow">
            {isAI ? <Bot size={36} className="text-zgreen" /> : <ShieldCheck size={36} className="text-zgreen" />}
          </div>

          <h1 className="m-0 text-3xl font-bold tracking-tight text-white">
            {isAI ? "AI Tools Disabled" : isYoutubeTimeout ? "YouTube Blocked" : "Focus Protection Active"}
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            {isAI
              ? "You're taking a ZverTs quiz. AI tools are disabled until the quiz is finished."
              : isYoutubeTimeout
                ? "Your 5-minute YouTube grace period has ended. Finish your lesson first."
                : "You're currently learning on ZverTs. Finish your lesson to access this site."}
          </p>

          {blockedUrl && (
            <div className="mx-auto mt-5 max-w-md truncate rounded-xl border border-white/[0.06] bg-black/30 px-4 py-2.5 text-xs text-white/35">
              {blockedUrl}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button onClick={() => chrome.tabs.update({ url: "https://www.zverts.com" })}>
              Return to ZverTs
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/25">
          VerT Focus — Stay focused, learn better
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<FocusPage />);
