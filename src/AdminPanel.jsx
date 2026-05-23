// ─────────────────────────────────────────────────────────────────────────────
// MUSIFY ADMIN PANEL
// Drop this file into your src/ folder, then:
//   1. Add the route in App.jsx (see bottom of this file for instructions)
//   2. Set Vercel env vars (see setup guide below)
// ─────────────────────────────────────────────────────────────────────────────
//
// VERCEL ENV VARS TO ADD (vercel.com → your project → Settings → Environment Variables):
//   VITE_GITHUB_TOKEN   → your GitHub Personal Access Token (needs repo scope)
//   VITE_GITHUB_REPO    → e.g.  yourname/musify
//   VITE_GITHUB_FILE    → e.g.  src/App.jsx   (path to the file with SONGS array)
//   VITE_ADMIN_PASSWORD → any password you want for the admin gate
//
// HOW TO GET A GITHUB TOKEN:
//   github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
//   → Generate new token → check "repo" scope → copy the token
//
// HOW TO ADD THE ROUTE (in your App.jsx):
//   1. import AdminPanel from "./AdminPanel";
//   2. In renderMain(), add at the TOP:
//        if (view === "admin") return <AdminPanel />;
//   3. Add a URL hash listener in App() useEffect:
//        useEffect(() => {
//          if (window.location.hash === "#admin") setView("admin");
//        }, []);
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "musify-admin";
const GITHUB_TOKEN   = import.meta.env.VITE_GITHUB_TOKEN   || "";
const GITHUB_REPO    = import.meta.env.VITE_GITHUB_REPO    || "";
const GITHUB_FILE    = import.meta.env.VITE_GITHUB_FILE    || "src/App.jsx";

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#09090f",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e8e8e8",
    padding: "0 0 80px",
  },
  header: {
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a10 100%)",
    borderBottom: "1px solid rgba(232,67,90,0.15)",
    padding: "28px 40px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  badge: {
    background: "rgba(232,67,90,0.12)",
    border: "1px solid rgba(232,67,90,0.3)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#e8435a",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
  },
  content: { maxWidth: 760, margin: "0 auto", padding: "40px 24px" },
  card: {
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "32px",
    marginBottom: 24,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#e8e8e8",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  grid1: { marginBottom: 20 },
  btnPrimary: {
    background: "#e8435a",
    color: "#fff",
    border: "none",
    borderRadius: 500,
    padding: "13px 36px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btnOutline: {
    background: "transparent",
    color: "#aaa",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 500,
    padding: "10px 24px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  preview: {
    background: "#0d0d14",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginTop: 20,
  },
  pill: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: color === "green"
      ? "rgba(34,197,94,0.1)"
      : color === "red"
      ? "rgba(232,67,90,0.1)"
      : "rgba(255,255,255,0.06)",
    border: `1px solid ${color === "green" ? "rgba(34,197,94,0.3)" : color === "red" ? "rgba(232,67,90,0.3)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 500,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: color === "green" ? "#4ade80" : color === "red" ? "#e8435a" : "#aaa",
  }),
};

// ── GitHub API helpers ───────────────────────────────────────────────────────
async function fetchFileFromGitHub() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return { content: atob(data.content.replace(/\n/g, "")), sha: data.sha };
}

async function commitFileToGitHub(newContent, sha, commitMsg) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: commitMsg,
      content: btoa(unescape(encodeURIComponent(newContent))),
      sha,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `GitHub commit failed: ${res.status}`);
  }
  return res.json();
}

function injectSongIntoSource(source, song) {
  // Find the closing ]; of the SONGS array and inject before it
  const marker = "].filter(";
  const idx = source.indexOf(marker);
  if (idx === -1) throw new Error('Could not find "].filter(" marker in SONGS array. Make sure your SONGS array ends with ].filter(...)');

  const newEntry = `  {
    id: "${song.id}",
    title: ${JSON.stringify(song.title)},
    artist: ${JSON.stringify(song.artist)},
    album: ${JSON.stringify(song.album)},
    audioUrl: ${JSON.stringify(song.audioUrl)},
    cover: ${JSON.stringify(song.cover)},
  },\n`;

  return source.slice(0, idx) + newEntry + source.slice(idx);
}

function generateId() {
  return String(Date.now()).slice(-6) + Math.random().toString(36).slice(2, 5);
}

// ── Preview Card ─────────────────────────────────────────────────────────────
function SongPreview({ song }) {
  const [coverErr, setCoverErr] = useState(false);
  const [audioOk, setAudioOk] = useState(null);
  const audioRef = useRef(null);

  const testAudio = () => {
    const a = new Audio(song.audioUrl);
    a.addEventListener("canplay", () => setAudioOk(true), { once: true });
    a.addEventListener("error", () => setAudioOk(false), { once: true });
    setTimeout(() => { if (audioOk === null) setAudioOk(false); }, 6000);
  };

  return (
    <div style={S.preview}>
      {/* Cover */}
      {song.cover && !coverErr ? (
        <img
          src={song.cover}
          alt={song.title}
          style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          onError={() => setCoverErr(true)}
        />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: 8, background: "linear-gradient(135deg,#e8435a,#7c1a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>♪</div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {song.title || <span style={{ color: "#555" }}>Song title</span>}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {song.artist || <span style={{ color: "#555" }}>Artist</span>}
          {song.album ? <span style={{ color: "#555" }}> · {song.album}</span> : null}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {song.cover && (
            <span style={S.pill(coverErr ? "red" : "green")}>
              {coverErr ? "✕ Cover broken" : "✓ Cover OK"}
            </span>
          )}
          {song.audioUrl && (
            <button
              onClick={testAudio}
              style={{ ...S.pill(audioOk === true ? "green" : audioOk === false ? "red" : ""), cursor: "pointer", border: "none", fontFamily: "inherit" }}
            >
              {audioOk === true ? "✓ Audio OK" : audioOk === false ? "✕ Audio broken" : "▶ Test audio"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Log display ──────────────────────────────────────────────────────────────
function LogLine({ entry }) {
  const colors = { info: "#888", success: "#4ade80", error: "#e8435a", step: "#60a5fa" };
  return (
    <div style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 13 }}>
      <span style={{ color: "#555", flexShrink: 0, fontFamily: "monospace", fontSize: 11, paddingTop: 1 }}>{entry.time}</span>
      <span style={{ color: colors[entry.type] || "#888" }}>{entry.msg}</span>
    </div>
  );
}

// ── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const check = () => {
    if (pw === ADMIN_PASSWORD) { onUnlock(); }
    else { setErr(true); setTimeout(() => setErr(false), 1200); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#e8435a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px" }}>♪</div>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Musify Admin</h2>
          <p style={{ color: "#666", fontSize: 13 }}>Enter your admin password to continue</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            style={{ ...S.input, borderColor: err ? "#e8435a" : "rgba(255,255,255,0.08)", textAlign: "center", fontSize: 16, letterSpacing: 3 }}
            autoFocus
          />
          {err && <p style={{ color: "#e8435a", fontSize: 12, textAlign: "center", margin: 0 }}>Incorrect password</p>}
          <button onClick={check} style={{ ...S.btnPrimary, justifyContent: "center" }}>Unlock</button>
        </div>
      </div>
    </div>
  );
}

// ── Config Check ─────────────────────────────────────────────────────────────
function ConfigWarning() {
  const missing = [];
  if (!GITHUB_TOKEN) missing.push("VITE_GITHUB_TOKEN");
  if (!GITHUB_REPO)  missing.push("VITE_GITHUB_REPO");
  if (!missing.length) return null;
  return (
    <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 6, fontSize: 13 }}>⚠ Missing environment variables</div>
      <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6 }}>
        Add these to Vercel → Project → Settings → Environment Variables, then redeploy:<br />
        {missing.map(v => <code key={v} style={{ display: "block", marginTop: 4, color: "#fbbf24", fontSize: 12, fontFamily: "monospace" }}>{v}</code>)}
      </div>
    </div>
  );
}

// ── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "", album: "", audioUrl: "", cover: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [{ msg, type, time, id: Date.now() + Math.random() }, ...prev].slice(0, 50));
  };

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
    style: { ...S.input },
    onFocus: e => { e.target.style.borderColor = "#e8435a"; },
    onBlur:  e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; },
  });

  const handleSubmit = async () => {
    // Validate
    const missing = ["title", "artist", "audioUrl"].filter(k => !form[k].trim());
    if (missing.length) {
      setErrorMsg(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      setErrorMsg("GitHub env vars not set — see the warning above.");
      return;
    }

    setErrorMsg("");
    setStatus("loading");
    setLogs([]);

    const song = {
      id: generateId(),
      title: form.title.trim(),
      artist: form.artist.trim(),
      album: form.album.trim(),
      audioUrl: form.audioUrl.trim(),
      cover: form.cover.trim(),
    };

    try {
      addLog(`Starting — adding "${song.title}" by ${song.artist}`, "step");

      addLog("Fetching current file from GitHub…", "info");
      const { content, sha } = await fetchFileFromGitHub();
      addLog(`✓ Fetched ${GITHUB_FILE} (${(content.length / 1024).toFixed(1)} KB)`, "success");

      addLog("Injecting song into SONGS array…", "info");
      const updated = injectSongIntoSource(content, song);
      addLog("✓ Song injected (ID: " + song.id + ")", "success");

      addLog("Committing to GitHub…", "info");
      await commitFileToGitHub(
        updated,
        sha,
        `feat: add song "${song.title}" by ${song.artist} [admin panel]`
      );
      addLog("✓ Committed to GitHub!", "success");
      addLog("Vercel will auto-redeploy in ~30–60 seconds.", "info");
      addLog("🎵 Done! Song will appear on the site after deployment.", "success");

      setStatus("success");
      setForm({ title: "", artist: "", album: "", audioUrl: "", cover: "" });
    } catch (e) {
      addLog("✕ Error: " + e.message, "error");
      setErrorMsg(e.message);
      setStatus("error");
    }
  };

  const reset = () => { setStatus("idle"); setErrorMsg(""); };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>♪</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Musify</span>
            <span style={S.badge}>Admin</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Song Manager · Auto-commits to GitHub → Vercel deploys</div>
        </div>
      </div>

      <div style={S.content}>
        <ConfigWarning />

        {/* How it works */}
        <div style={{ ...S.card, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>How it works</div>
          <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.8 }}>
            1. Fill in the song details below using your Cloudinary URLs<br />
            2. Click <strong style={{ color: "#e8e8e8" }}>Add Song</strong> — this reads your <code style={{ color: "#60a5fa", fontSize: 12 }}>{GITHUB_FILE}</code> from GitHub<br />
            3. The new song is injected into the <code style={{ color: "#60a5fa", fontSize: 12 }}>SONGS</code> array and committed automatically<br />
            4. Vercel detects the commit and redeploys your site (~30–60 sec)
          </div>
        </div>

        {/* Form */}
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Add New Song
          </h2>

          <div style={S.grid2}>
            <div>
              <label style={S.label}>Song Title *</label>
              <input placeholder="e.g. Vaishakha Sandhye" {...field("title")} />
            </div>
            <div>
              <label style={S.label}>Artist *</label>
              <input placeholder="e.g. KJ Yesudas" {...field("artist")} />
            </div>
          </div>

          <div style={S.grid1}>
            <label style={S.label}>Album</label>
            <input placeholder="e.g. Nadodikkattu" {...field("album")} />
          </div>

          <div style={{ ...S.grid1, marginBottom: 0 }}>
            <label style={S.label}>Audio URL (Cloudinary MP3) *</label>
            <input
              placeholder="https://res.cloudinary.com/.../song.mp3"
              {...field("audioUrl")}
              style={{ ...S.input, fontFamily: "monospace", fontSize: 12 }}
            />
          </div>

          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label style={S.label}>Cover Image URL (Cloudinary)</label>
            <input
              placeholder="https://res.cloudinary.com/.../cover.jpg"
              {...field("cover")}
              style={{ ...S.input, fontFamily: "monospace", fontSize: 12 }}
            />
          </div>

          {/* Preview */}
          {(form.title || form.artist || form.audioUrl || form.cover) && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Preview</div>
              <SongPreview song={form} />
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: 20, background: "rgba(232,67,90,0.08)", border: "1px solid rgba(232,67,90,0.2)", borderRadius: 8, padding: "12px 16px", color: "#e8435a", fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center" }}>
            {status === "success" ? (
              <>
                <span style={S.pill("green")}>✓ Song added successfully!</span>
                <button onClick={reset} style={{ ...S.btnOutline, fontFamily: "'DM Sans', sans-serif" }}>Add another</button>
              </>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={status === "loading"}
                style={{ ...S.btnPrimary, opacity: status === "loading" ? 0.7 : 1, cursor: status === "loading" ? "wait" : "pointer" }}
              >
                {status === "loading" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Committing…
                  </>
                ) : "Add Song to Musify"}
              </button>
            )}
          </div>
        </div>

        {/* Activity Log */}
        {logs.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>Activity Log</div>
            <div style={{ background: "#0a0a0f", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace" }}>
              {logs.map(e => <LogLine key={e.id} entry={e} />)}
            </div>
          </div>
        )}

        {/* Quick tips */}
        <div style={{ ...S.card, background: "transparent", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Cloudinary Tips</div>
          <div style={{ color: "#666", fontSize: 12, lineHeight: 2 }}>
            • Upload to Cloudinary → click the asset → copy the URL<br />
            • For audio: use <code style={{ color: "#aaa" }}>/video/upload/q_auto/f_auto/v…/song.mp3</code><br />
            • For images: use <code style={{ color: "#aaa" }}>/image/upload/q_auto/f_auto/v…/cover.jpg</code><br />
            • The <code style={{ color: "#aaa" }}>q_auto/f_auto</code> flags auto-optimize quality & format
          </div>
        </div>
      </div>
    </div>
  );
}
