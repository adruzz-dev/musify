import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY CONFIG — fill in your details
// ─────────────────────────────────────────────────────────────────────────────
const CLOUD_NAME = "dasnicvlp";         // e.g. "mymusify"
const UPLOAD_PRESET = "musify_uploads";   // e.g. "musify_uploads"
const USERS_FILE_KEY = "musify_users";        // tag used to find user data file

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED SONGS — add your songs here manually
// Each song needs: id, title, artist, album (optional), cover (image URL),
//                  audioUrl (Cloudinary mp3 URL), playlist (must match a
//                  playlist id below, or leave "")
// ─────────────────────────────────────────────────────────────────────────────
const ALL_SONGS = [
  {
    id: "song-1",
    title: "Vaisakha Sandhye",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779530849/images_p3p8bd.jpg",   // put Cloudinary image URL here
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779531012/Vaisakha_Sandhye_HD_Video_Song_Mohanlal_Shobana_-_Nadodikkattu_-_Saina_Music_youtube_u2fvmk.mp3", // put Cloudinary audio URL here
    playlist: "Malayalam Melodies",
  },
  {
    id: "song-2",
    title: "Manikyakallu",
    artist: "Shreya Ghoshal",
    album: "Oru Kadha Pole",
    cover: "",
    audioUrl: "",
    playlist: "playlist-1",
  },
  {
    id: "song-3",
    title: "Thumbi Vaa",
    artist: "Sid Sriram",
    album: "",
    cover: "",
    audioUrl: "",
    playlist: "playlist-2",
  },
   {
    id: "song-1",
    title: "Ente Keralam",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "",   // put Cloudinary image URL here
    audioUrl: "", // put Cloudinary audio URL here
    playlist: "playlist-1",
  },
   {
    id: "song-1",
    title: "Ente Keralam",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "",   // put Cloudinary image URL here
    audioUrl: "", // put Cloudinary audio URL here
    playlist: "playlist-1",
  },
   {
    id: "song-1",
    title: "Ente Keralam",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "",   // put Cloudinary image URL here
    audioUrl: "", // put Cloudinary audio URL here
    playlist: "playlist-1",
  },
   {
    id: "song-1",
    title: "Ente Keralam",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "",   // put Cloudinary image URL here
    audioUrl: "", // put Cloudinary audio URL here
    playlist: "playlist-1",
  },
   {
    id: "song-1",
    title: "Ente Keralam",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "",   // put Cloudinary image URL here
    audioUrl: "", // put Cloudinary audio URL here
    playlist: "playlist-1",
  },
  // ── ADD MORE SONGS BELOW ──
  // {
  //   id: "song-4",
  //   title: "Song Title",
  //   artist: "Artist Name",
  //   album: "Album Name",
  //   cover: "https://res.cloudinary.com/YOUR_CLOUD/image/upload/...",
  //   audioUrl: "https://res.cloudinary.com/YOUR_CLOUD/video/upload/...",
  //   playlist: "playlist-1",   // or "" for no playlist
  // },
];

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED PLAYLISTS — add your playlists here manually
// ─────────────────────────────────────────────────────────────────────────────
const ALL_PLAYLISTS = [
  { id: "playlist-1", name: "Malayalam Hits", cover: "" },
  { id: "playlist-2", name: "Chill Vibes",    cover: "" },
  // ── ADD MORE PLAYLISTS BELOW ──
  // { id: "playlist-3", name: "Party Mix", cover: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY USER AUTH HELPERS
// Users are stored as a JSON file uploaded to Cloudinary with a public_id tag.
// This is a simple, serverless auth — suitable for small apps.
// ─────────────────────────────────────────────────────────────────────────────
const getUsersFileUrl = () =>
  `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${USERS_FILE_KEY}.json`;

const fetchUsers = async () => {
  try {
    const res = await fetch(getUsersFileUrl() + "?t=" + Date.now());
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

const saveUsers = async (users) => {
  const blob = new Blob([JSON.stringify(users)], { type: "application/json" });
  const file = new File([blob], `${USERS_FILE_KEY}.json`, { type: "application/json" });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", USERS_FILE_KEY);
  formData.append("resource_type", "raw");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Save failed");
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO PLAYER HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useAudioPlayer(onEnded) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.addEventListener("ended", () => onEnded?.());
    audioRef.current.addEventListener("timeupdate", () =>
      setProgress(audioRef.current.currentTime)
    );
    audioRef.current.addEventListener("loadedmetadata", () =>
      setDuration(audioRef.current.duration)
    );
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const load = useCallback((url) => {
    if (!audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.load();
    audioRef.current.play();
  }, []);

  return {
    progress, duration,
    volume: Math.round(volume * 100),
    load,
    play:  () => audioRef.current?.play(),
    pause: () => audioRef.current?.pause(),
    seek:  (r) => { if (audioRef.current) audioRef.current.currentTime = r * (audioRef.current.duration || 0); },
    setVol:(v) => { const val = v / 100; setVolume(val); if (audioRef.current) audioRef.current.volume = val; },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER ART
// ─────────────────────────────────────────────────────────────────────────────
function CoverArt({ cover, size = 48, title, radius = 8 }) {
  const initials = title?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "♪";
  const sz = typeof size === "number" ? size : "100%";
  return cover ? (
    <img src={cover} alt={title}
      style={{ width: sz, height: sz, borderRadius: radius, objectFit: "cover", flexShrink: 0, display: "block" }} />
  ) : (
    <div style={{
      width: sz, height: sz, borderRadius: radius, flexShrink: 0,
      background: "linear-gradient(135deg,#e8435a 0%,#7c1a2a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: typeof size === "number" ? Math.max(10, size * 0.28) : 14,
      fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: 1,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER BAR
// ─────────────────────────────────────────────────────────────────────────────
function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile }) {
  const pct = `${(progress / (duration || 1)) * 100}%`;
  const bar = (
    <div onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }}
      style={{ flex: 1, height: isMobile ? 3 : 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer", position: "relative" }}>
      <div style={{ width: pct, height: "100%", background: "#e8435a", borderRadius: 2, transition: "width 0.2s" }} />
    </div>
  );

  const controls = (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 20 }}>
      <button onClick={onPrev} style={{ background: "none", border: "none", cursor: "pointer", color: "#777", fontSize: isMobile ? 16 : 18, padding: 4 }}>⏮</button>
      <button onClick={onToggle} style={{
        width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, borderRadius: "50%",
        background: "#e8435a", border: "none", cursor: "pointer", color: "#fff",
        fontSize: isMobile ? 13 : 15, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button onClick={onNext} style={{ background: "none", border: "none", cursor: "pointer", color: "#777", fontSize: isMobile ? 16 : 18, padding: 4 }}>⏭</button>
    </div>
  );

  if (isMobile) return (
    <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a0f 85%,rgba(10,10,15,0.9))", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#555", fontSize: 10, minWidth: 28, textAlign: "right" }}>{formatTime(progress)}</span>
        {bar}
        <span style={{ color: "#555", fontSize: 10, minWidth: 28 }}>{formatTime(duration)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {track ? <CoverArt cover={track.cover} size={38} title={track.title} /> : <div style={{ width: 38, height: 38, borderRadius: 8, background: "#1a1a22" }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#666", fontSize: 11 }}>{track?.artist ?? "Select a song"}</div>
        </div>
        {track && <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#444", fontSize: 18 }}>{liked ? "♥" : "♡"}</button>}
        {controls}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,#090912 85%,rgba(9,9,18,0.9))", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "12px 28px 14px", display: "flex", alignItems: "center", gap: 24, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 220, flex: 1 }}>
        {track ? <CoverArt cover={track.cover} size={44} title={track.title} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: "#1a1a22" }} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{track?.artist ?? "Select a song to play"}</div>
        </div>
        {track && <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#444", fontSize: 16, marginLeft: 4 }}>{liked ? "♥" : "♡"}</button>}
      </div>
      <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {controls}
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <span style={{ color: "#555", fontSize: 11, minWidth: 34, textAlign: "right" }}>{formatTime(progress)}</span>
          {bar}
          <span style={{ color: "#555", fontSize: 11, minWidth: 34 }}>{formatTime(duration)}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
        <span style={{ color: "#444", fontSize: 13 }}>🔊</span>
        <input type="range" min={0} max={100} step={1} value={volume} onChange={e => onVolume(+e.target.value)}
          style={{ width: 80, accentColor: "#e8435a", cursor: "pointer" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR (desktop)
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, playlists, selectedPlaylist, setSelectedPlaylist, user, onLogout }) {
  const nav = (id, label, icon) => (
    <button key={id} onClick={() => setView(id)} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
      background: view === id ? "rgba(232,67,90,0.13)" : "none",
      border: "none", borderRadius: 8, cursor: "pointer", padding: "9px 14px",
      color: view === id ? "#e8435a" : "#777", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {label}
    </button>
  );
  return (
    <div style={{ width: 220, background: "#0b0b10", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "22px 12px 110px", gap: 3, overflowY: "auto", flexShrink: 0 }}>
      <div style={{ color: "#e8435a", fontWeight: 900, fontSize: 22, letterSpacing: -0.5, padding: "0 14px 22px" }}>musify</div>
      {nav("home",    "Home",         "🏠")}
      {nav("library", "Your Library", "📚")}
      {nav("liked",   "Liked Songs",  "♥")}
      {nav("search",  "Search",       "🔍")}
      <div style={{ margin: "14px 0 10px", paddingLeft: 14, color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: 1, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 }}>PLAYLISTS</div>
      {playlists.map(pl => (
        <button key={pl.id} onClick={() => { setSelectedPlaylist(pl.id); setView("playlist"); }} style={{
          background: view === "playlist" && selectedPlaylist === pl.id ? "rgba(255,255,255,0.05)" : "none",
          border: "none", borderRadius: 8, cursor: "pointer", padding: "8px 14px",
          color: view === "playlist" && selectedPlaylist === pl.id ? "#ccc" : "#666",
          fontFamily: "inherit", fontSize: 12, width: "100%", textAlign: "left",
        }}>
          📋 {pl.name}
        </button>
      ))}
      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ paddingLeft: 14, color: "#555", fontSize: 11, marginBottom: 8 }}>👤 {user?.name || user?.email}</div>
        <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: "inherit", fontSize: 12, padding: "8px 14px", width: "100%", textAlign: "left" }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV (mobile)
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ view, setView }) {
  const items = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "search", label: "Search", icon: "🔍" },
    { id: "library", label: "Library", icon: "📚" },
    { id: "liked", label: "Liked", icon: "♥" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0b0b10", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", zIndex: 101, height: 56 }}>
      {items.map(item => (
        <button key={item.id} onClick={() => setView(item.id)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          color: view === item.id ? "#e8435a" : "#555", fontSize: 10, fontFamily: "inherit", fontWeight: 600,
        }}>
          <span style={{ fontSize: 19 }}>{item.icon}</span>{item.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRACK ROW
// ─────────────────────────────────────────────────────────────────────────────
function TrackRow({ track, index, isPlaying, isCurrent, onPlay, onLike, liked, isMobile }) {
  const [hover, setHover] = useState(false);
  const playIcon = isCurrent && isPlaying ? "⏸" : "▶";

  if (isMobile) return (
    <div onClick={onPlay} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.07)" : "transparent", cursor: "pointer" }}>
      <div style={{ color: isCurrent ? "#e8435a" : "#555", fontSize: 12, width: 18, textAlign: "center", flexShrink: 0 }}>{playIcon}</div>
      <CoverArt cover={track.cover} size={42} title={track.title} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: isCurrent ? "#e8435a" : "#efefef", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
        <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{track.artist}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#444", fontSize: 17, padding: 4, flexShrink: 0 }}>{liked ? "♥" : "♡"}</button>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onDoubleClick={onPlay}
      style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr 130px 36px", alignItems: "center", gap: 12, padding: "6px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.07)" : hover ? "rgba(255,255,255,0.03)" : "transparent", cursor: "pointer" }}>
      <div style={{ color: isCurrent ? "#e8435a" : "#555", fontSize: 12, textAlign: "center" }}>
        {(hover || isCurrent) ? <span onClick={onPlay}>{playIcon}</span> : index + 1}
      </div>
      <CoverArt cover={track.cover} size={40} title={track.title} />
      <div>
        <div style={{ color: isCurrent ? "#e8435a" : "#efefef", fontSize: 13, fontWeight: 600 }}>{track.title}</div>
        <div style={{ color: "#666", fontSize: 11, marginTop: 1 }}>{track.artist}</div>
      </div>
      <div style={{ color: "#555", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.album || ""}</div>
      <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "transparent", fontSize: 13, padding: 0, opacity: hover || liked ? 1 : 0 }}>♥</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN (Login / Signup)
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 16px", color: "#f0f0f0", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const handleSubmit = async () => {
    setErr("");
    if (!email.trim() || !pw.trim()) { setErr("Email and password are required."); return; }
    if (mode === "signup") {
      if (!name.trim()) { setErr("Please enter your name."); return; }
      if (pw !== confirmPw) { setErr("Passwords do not match."); return; }
      if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    }
    setLoading(true);
    try {
      const users = await fetchUsers();
      const key = email.toLowerCase().trim();
      if (mode === "login") {
        if (!users[key]) { setErr("No account found with this email."); setLoading(false); return; }
        if (users[key].pw !== pw) { setErr("Incorrect password."); setLoading(false); return; }
        onAuth({ email: key, name: users[key].name });
      } else {
        if (users[key]) { setErr("An account with this email already exists."); setLoading(false); return; }
        users[key] = { name: name.trim(), pw };
        await saveUsers(users);
        onAuth({ email: key, name: name.trim() });
      }
    } catch (e) {
      setErr("Something went wrong. Check your Cloudinary config.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#090912",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: 16,
      backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,67,90,0.18) 0%, transparent 70%)",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ color: "#e8435a", fontWeight: 900, fontSize: 36, letterSpacing: -1, lineHeight: 1 }}>musify</div>
          <div style={{ color: "#444", fontSize: 13, marginTop: 6 }}>Your music, your world</div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "32px 28px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, marginBottom: 26 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{
                flex: 1, background: mode === m ? "#e8435a" : "none",
                border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer",
                color: mode === m ? "#fff" : "#666", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                transition: "all 0.2s",
              }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                style={inp} onFocus={e => e.target.style.borderColor = "rgba(232,67,90,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
              style={inp} onFocus={e => e.target.style.borderColor = "rgba(232,67,90,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password"
              style={inp} onFocus={e => e.target.style.borderColor = "rgba(232,67,90,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            {mode === "signup" && (
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm password"
                style={inp} onFocus={e => e.target.style.borderColor = "rgba(232,67,90,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            )}

            {err && (
              <div style={{ background: "rgba(232,67,90,0.1)", border: "1px solid rgba(232,67,90,0.25)", borderRadius: 8, padding: "10px 14px", color: "#e8435a", fontSize: 12 }}>
                {err}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              background: loading ? "#6a1e2a" : "#e8435a", border: "none", borderRadius: 10,
              color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
              padding: "13px 0", cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
              transition: "background 0.2s",
            }}>
              {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#333", fontSize: 11, marginTop: 20 }}>
          Musify • Your personal music player
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SONG CARD (grid)
// ─────────────────────────────────────────────────────────────────────────────
function SongCard({ track, isCurrent, isPlaying, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: isCurrent ? "rgba(232,67,90,0.1)" : hover ? "rgba(255,255,255,0.04)" : "#111118",
        borderRadius: 12, padding: isMobile ? 10 : 14, cursor: "pointer",
        border: `1px solid ${isCurrent ? "rgba(232,67,90,0.35)" : "rgba(255,255,255,0.05)"}`,
        transition: "all 0.15s", position: "relative",
      }}>
      <div style={{ position: "relative" }}>
        <CoverArt cover={track.cover} size={isMobile ? "100%" : 120} title={track.title} radius={10} />
        {(hover || isCurrent) && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 10, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>
              {isCurrent && isPlaying ? "⏸" : "▶"}
            </div>
          </div>
        )}
      </div>
      <div style={{ color: isCurrent ? "#e8435a" : "#efefef", fontWeight: 700, fontSize: 13, marginTop: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
      <div style={{ color: "#666", fontSize: 11, marginTop: 3 }}>{track.artist}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function Musify() {
  // ── Auth ──
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("musify_user")) || null; } catch { return null; }
  });

  // ── App state ──
  const [view, setView] = useState("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [search, setSearch] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likedTracks, setLikedTracksArr] = useState([]);
  const [queue, setQueue] = useState([]);

  const isMobile = useIsMobile();

  const handleEnded = useCallback(() => {
    const q = queue.length > 0 ? queue : ALL_SONGS;
    const idx = q.findIndex(t => t.id === currentTrack?.id);
    const next = q[(idx + 1) % q.length];
    if (next) playTrack(next, q);
  }, [currentTrack, queue]);

  const audio = useAudioPlayer(handleEnded);

  // Save user to session
  const handleAuth = (u) => {
    sessionStorage.setItem("musify_user", JSON.stringify(u));
    setUser(u);
  };
  const handleLogout = () => {
    sessionStorage.removeItem("musify_user");
    setUser(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    audio.pause();
  };

  // ── Play ──
  const playTrack = useCallback((track, trackList = []) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play(); setIsPlaying(true); }
      return;
    }
    if (!track.audioUrl) return; // no audio, skip
    setCurrentTrack(track);
    setIsPlaying(true);
    if (trackList.length > 0) setQueue(trackList);
    audio.load(track.audioUrl);
  }, [currentTrack, isPlaying, audio]);

  const handleNext = useCallback(() => {
    const q = queue.length > 0 ? queue : ALL_SONGS;
    const idx = q.findIndex(t => t.id === currentTrack?.id);
    const next = q[(idx + 1) % q.length];
    if (next) playTrack(next, q);
  }, [currentTrack, queue, playTrack]);

  const handlePrev = useCallback(() => {
    if (audio.progress > 3) { audio.seek(0); return; }
    const q = queue.length > 0 ? queue : ALL_SONGS;
    const idx = q.findIndex(t => t.id === currentTrack?.id);
    const prev = q[(idx - 1 + q.length) % q.length];
    if (prev) playTrack(prev, q);
  }, [currentTrack, queue, playTrack, audio]);

  const handleLike = (track) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(track.id)) { next.delete(track.id); setLikedTracksArr(a => a.filter(t => t.id !== track.id)); }
      else { next.add(track.id); setLikedTracksArr(a => [...a, track]); }
      return next;
    });
  };

  const rowProps = (track, i, list) => ({
    track, index: i, isPlaying, isCurrent: currentTrack?.id === track.id,
    onPlay: () => playTrack(track, list),
    liked: likedIds.has(track.id), onLike: () => handleLike(track),
    isMobile,
  });

  // ── Search ──
  const searchResults = search.trim()
    ? ALL_SONGS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase()) ||
        s.album.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const playlistSongs = (plId) => ALL_SONGS.filter(s => s.playlist === plId);
  const mobilePad = currentTrack ? 168 : 72;

  // ── Auth gate ──
  if (!user) return <AuthScreen onAuth={handleAuth} />;

  // ── Main UI ──
  return (
    <div style={{ display: "flex", height: "100vh", background: "#090912", fontFamily: "'Segoe UI', sans-serif", color: "#f0f0f0", overflow: "hidden" }}>

      {!isMobile && (
        <Sidebar
          view={view} setView={setView}
          playlists={ALL_PLAYLISTS}
          selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist}
          user={user} onLogout={handleLogout}
        />
      )}

      {/* Main scroll area */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? mobilePad : 110 }}>

        {/* Mobile header */}
        {isMobile && (
          <div style={{ padding: "18px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e8435a", fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>musify</div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 12 }}>Logout</button>
          </div>
        )}

        {/* ── HOME ── */}
        {view === "home" && (
          <div style={{ padding: isMobile ? "12px 16px" : "28px 32px" }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4, marginTop: 0 }}>
              {getGreeting()} 🎵
            </h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 28, marginTop: 0 }}>Welcome back, {user.name}</p>

            {ALL_PLAYLISTS.map(pl => {
              const songs = playlistSongs(pl.id);
              if (songs.length === 0) return null;
              return (
                <div key={pl.id} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📋 {pl.name}</h3>
                    <button onClick={() => { setSelectedPlaylist(pl.id); setView("playlist"); }}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                      See all →
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(148px,1fr))", gap: isMobile ? 10 : 14 }}>
                    {songs.slice(0, isMobile ? 4 : 6).map(t => (
                      <SongCard key={t.id} track={t}
                        isCurrent={currentTrack?.id === t.id} isPlaying={isPlaying}
                        onClick={() => playTrack(t, songs)} isMobile={isMobile} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* All songs if no playlists */}
            {ALL_PLAYLISTS.every(pl => playlistSongs(pl.id).length === 0) && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🎵 All Songs</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(148px,1fr))", gap: isMobile ? 10 : 14 }}>
                  {ALL_SONGS.map(t => (
                    <SongCard key={t.id} track={t}
                      isCurrent={currentTrack?.id === t.id} isPlaying={isPlaying}
                      onClick={() => playTrack(t, ALL_SONGS)} isMobile={isMobile} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LIBRARY ── */}
        {view === "library" && (
          <div style={{ padding: isMobile ? "12px 0" : "28px 32px" }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, marginTop: 0, padding: isMobile ? "0 16px" : 0 }}>Your Library</h2>
            {ALL_SONGS.length === 0
              ? <div style={{ color: "#444", padding: isMobile ? "0 16px" : 0 }}>No songs added yet.</div>
              : ALL_SONGS.map((t, i) => <TrackRow key={t.id} {...rowProps(t, i, ALL_SONGS)} />)
            }
          </div>
        )}

        {/* ── LIKED ── */}
        {view === "liked" && (
          <div style={{ padding: isMobile ? "12px 0" : "28px 32px" }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, marginTop: 0, padding: isMobile ? "0 16px" : 0 }}>♥ Liked Songs</h2>
            {likedTracks.length === 0
              ? <div style={{ color: "#444", padding: isMobile ? "0 16px" : 0 }}>No liked songs yet. Tap ♡ on any song!</div>
              : likedTracks.map((t, i) => <TrackRow key={t.id} {...rowProps(t, i, likedTracks)} />)
            }
          </div>
        )}

        {/* ── SEARCH ── */}
        {view === "search" && (
          <div style={{ padding: isMobile ? "12px 16px" : "28px 32px" }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>Search</h2>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search songs, artists, albums…"
              style={{
                width: "100%", maxWidth: isMobile ? "100%" : 460,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24, padding: "12px 20px", color: "#f0f0f0", fontSize: 14,
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop: 20 }}>
              {search && searchResults.length === 0 && <div style={{ color: "#444" }}>No songs found for "{search}"</div>}
              {searchResults.map((t, i) => <TrackRow key={t.id} {...rowProps(t, i, searchResults)} />)}
              {!search && (
                <div>
                  <div style={{ color: "#444", fontSize: 13, marginBottom: 16 }}>Browse by playlist</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {ALL_PLAYLISTS.map(pl => (
                      <div key={pl.id} onClick={() => { setSelectedPlaylist(pl.id); setView("playlist"); }}
                        style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(135deg,#e8435a,#7c1a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
                        <div>
                          <div style={{ color: "#efefef", fontWeight: 600, fontSize: 14 }}>{pl.name}</div>
                          <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{playlistSongs(pl.id).length} songs</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYLIST ── */}
        {view === "playlist" && selectedPlaylist && (
          <div style={{ padding: isMobile ? "12px 0" : "28px 32px" }}>
            {(() => {
              const pl = ALL_PLAYLISTS.find(p => p.id === selectedPlaylist);
              const songs = playlistSongs(selectedPlaylist);
              return (
                <>
                  <div style={{ padding: isMobile ? "0 16px 16px" : "0 0 20px" }}>
                    <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4, marginTop: 0 }}>📋 {pl?.name}</h2>
                    <div style={{ color: "#555", fontSize: 13 }}>{songs.length} songs</div>
                    {songs.length > 0 && (
                      <button onClick={() => playTrack(songs[0], songs)} style={{
                        marginTop: 14, background: "#e8435a", border: "none", borderRadius: 24,
                        color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13,
                        padding: "10px 22px", cursor: "pointer",
                      }}>▶ Play All</button>
                    )}
                  </div>
                  {songs.length === 0
                    ? <div style={{ color: "#444", padding: isMobile ? "0 16px" : 0 }}>No songs in this playlist.</div>
                    : songs.map((t, i) => <TrackRow key={t.id} {...rowProps(t, i, songs)} />)
                  }
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Player bar */}
      <PlayerBar
        track={currentTrack} isPlaying={isPlaying}
        onToggle={() => {
          if (!currentTrack) return;
          if (isPlaying) { audio.pause(); setIsPlaying(false); }
          else { audio.play(); setIsPlaying(true); }
        }}
        progress={audio.progress} duration={audio.duration}
        onSeek={audio.seek} onNext={handleNext} onPrev={handlePrev}
        volume={audio.volume} onVolume={audio.setVol}
        liked={currentTrack ? likedIds.has(currentTrack.id) : false}
        onLike={() => currentTrack && handleLike(currentTrack)}
        isMobile={isMobile}
      />

      {isMobile && <BottomNav view={view} setView={setView} />}
    </div>
  );
}