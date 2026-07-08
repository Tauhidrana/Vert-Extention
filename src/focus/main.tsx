import "../styles/global.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Card, Logo } from "../shared/ui";

function FocusPage() {
  const [blockedUrl, setBlockedUrl] = useState("");

  useEffect(() => {
    setBlockedUrl(new URLSearchParams(location.search).get("url") ?? "");
  }, []);

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-xl">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <Card className="p-8 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg border border-zgreen/40 bg-zgreen/10 text-zgreen shadow-glow">
            <ShieldCheck size={32} />
          </div>
          <h1 className="m-0 text-4xl font-black tracking-normal">Focus Protection Enabled</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-white/68">
            You're currently learning on ZverTs. Finish your lesson first.
          </p>
          {blockedUrl && <p className="mt-4 truncate rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">{blockedUrl}</p>}
          <div className="mt-7 flex justify-center">
            <Button onClick={() => chrome.tabs.update({ url: "https://www.zverts.com" })}>
              Return to ZverTs <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<FocusPage />);
