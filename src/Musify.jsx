import { useState, useRef, useEffect, useCallback } from "react";

// ─── ADMIN PASSWORD ─────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "musify@admin";

// ─── CLOUDINARY UPLOAD ─────────────────────────────────────────────────────────
const uploadToCloudinary = async (file, cloudName, uploadPreset, resourceType = "auto") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || "Upload failed");
};

// ─── SPOTIFY ───────────────────────────────────────────────────────────────────
const SPOTIFY_CLIENT_ID = "3e5e5882ff8a49f5ad0ba92f7a8885a6";
const SPOTIFY_CLIENT_SECRET = "81fc642a1f2f429f8803847e2e4e4445";
let spotifyToken = null, spotifyTokenExpiry = 0;
const getSpotifyToken = async () => {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET), "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return spotifyToken;
  } catch { return null; }
};
const spotifyGet = async (path) => {
  const token = await getSpotifyToken();
  if (!token) return null;
  try { const res = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } }); return res.json(); } catch { return null; }
};
const searchSpotifyTracks = async (query) => {
  const data = await spotifyGet(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`);
  return (data?.tracks?.items || []).map((t) => ({
    id: `yt-spotify-${t.id}`, videoId: null,
    searchQuery: `${t.name} ${t.artists?.[0]?.name} official audio`,
    title: t.name, artist: t.artists?.[0]?.name || "Unknown",
    album: t.album?.name || "", duration: Math.floor((t.duration_ms || 0) / 1000),
    genre: "", cover: t.album?.images?.[0]?.url || "", source: "spotify",
  }));
};
const getSpotifyNewReleases = async () => {
  const data = await spotifyGet("/browse/new-releases?limit=10");
  return (data?.albums?.items || []).map((a) => ({
    id: `yt-album-${a.id}`, videoId: null,
    searchQuery: `${a.name} ${a.artists?.[0]?.name} official audio`,
    title: a.name, artist: a.artists?.[0]?.name || "Unknown",
    album: a.name, duration: 0, genre: "", cover: a.images?.[0]?.url || "", source: "spotify",
  }));
};
const getSpotifyFeatured = async () => {
  const data = await spotifyGet("/browse/featured-playlists?limit=6");
  return data?.playlists?.items || [];
};
const searchItunesForYT = async (query) => {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`);
    const data = await res.json();
    return (data.results || []).map((t) => ({
      id: `yt-itunes-${t.trackId}`, videoId: null,
      searchQuery: `${t.trackName} ${t.artistName} official audio`,
      title: t.trackName || "Unknown", artist: t.artistName || "Unknown",
      album: t.collectionName || "", duration: Math.floor((t.trackTimeMillis || 0) / 1000),
      genre: t.primaryGenreName || "", cover: t.artworkUrl100 || "", source: "itunes",
    }));
  } catch { return []; }
};

// ─── UTILS ─────────────────────────────────────────────────────────────────────
function formatTime(secs) {
  if (!secs) return "0:00";
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
function generateId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ─── YOUTUBE PLAYER HOOK ───────────────────────────────────────────────────────
function useYouTubePlayer(onEnded) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const initPlayer = () => {
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "1", width: "1",
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) onEnded?.();
            if (e.data === window.YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                setProgress(playerRef.current?.getCurrentTime?.() || 0);
                setDuration(playerRef.current?.getDuration?.() || 0);
              }, 500);
            } else clearInterval(intervalRef.current);
          },
        },
      });
    };
    if (window.YT?.Player) initPlayer();
    else window.onYouTubeIframeAPIReady = initPlayer;
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadVideo = useCallback((videoId) => {
    if (!playerRef.current) return;
    playerRef.current.loadVideoById(videoId);
    playerRef.current.setVolume(volume);
  }, [volume]);

  return {
    containerRef, ready, progress, duration, volume,
    loadVideo,
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seek: (ratio) => { const dur = playerRef.current?.getDuration?.() || 0; playerRef.current?.seekTo(ratio * dur, true); },
    setVol: (v) => { setVolume(v); playerRef.current?.setVolume(v); },
  };
}

// ─── AUDIO PLAYER HOOK (for Cloudinary mp3) ────────────────────────────────────
function useAudioPlayer(onEnded) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.addEventListener("ended", () => onEnded?.());
    audioRef.current.addEventListener("timeupdate", () => setProgress(audioRef.current.currentTime));
    audioRef.current.addEventListener("loadedmetadata", () => setDuration(audioRef.current.duration));
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);

  const loadAudio = useCallback((url) => {
    if (!audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.load();
    audioRef.current.play();
  }, []);

  return {
    ready, progress, duration, volume: Math.round(volume * 100),
    loadAudio,
    play: () => audioRef.current?.play(),
    pause: () => audioRef.current?.pause(),
    seek: (ratio) => { if (audioRef.current) audioRef.current.currentTime = ratio * (audioRef.current.duration || 0); },
    setVol: (v) => { const val = v / 100; setVolume(val); if (audioRef.current) audioRef.current.volume = val; },
  };
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────────
function CoverArt({ cover, size = 48, title }) {
  const initials = title?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return cover ? (
    <img src={cover} alt={title} style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 8, background: "linear-gradient(135deg,#e8435a,#9b2335)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: typeof size === "number" ? size * 0.28 : 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
      {initials}
    </div>
  );
}

const ctrlBtn = { background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18, padding: 4 };

function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile, loading }) {
  if (isMobile) return (
    <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a0f 80%,rgba(10,10,15,0.92))", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#666", fontSize: 10, minWidth: 28, textAlign: "right" }}>{formatTime(progress)}</span>
        <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }} style={{ flex: 1, height: 3, background: "#2a2a2a", borderRadius: 2, cursor: "pointer" }}>
          <div style={{ width: `${(progress / (duration || 1)) * 100}%`, height: "100%", background: "#e8435a", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        <span style={{ color: "#666", fontSize: 10, minWidth: 28 }}>{formatTime(duration)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {track && <CoverArt cover={track.cover} size={40} title={track.title} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#888", fontSize: 11 }}>{track?.artist ?? "Select a song to play"}</div>
        </div>
        {track && <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#555", fontSize: 18 }}>{liked ? "♥" : "♡"}</button>}
        <button onClick={onPrev} style={ctrlBtn}>⏮</button>
        <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", border: "none", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {loading ? "⏳" : isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={onNext} style={ctrlBtn}>⏭</button>
      </div>
    </div>
  );
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a0f 80%,rgba(10,10,15,0.92))", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px 16px", display: "flex", alignItems: "center", gap: 24, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200, flex: 1 }}>
        {track && <CoverArt cover={track.cover} size={44} title={track.title} />}
        <div>
          <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600 }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#888", fontSize: 11 }}>{track?.artist ?? "Select a song to play"}</div>
        </div>
        {track && <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#555", fontSize: 16 }}>{liked ? "♥" : "♡"}</button>}
      </div>
      <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={onPrev} style={ctrlBtn}>⏮</button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", border: "none", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading ? "⏳" : isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={onNext} style={ctrlBtn}>⏭</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <span style={{ color: "#666", fontSize: 11, minWidth: 32, textAlign: "right" }}>{formatTime(progress)}</span>
          <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }} style={{ flex: 1, height: 4, background: "#2a2a2a", borderRadius: 2, cursor: "pointer" }}>
            <div style={{ width: `${(progress / (duration || 1)) * 100}%`, height: "100%", background: "#e8435a", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
          <span style={{ color: "#666", fontSize: 11, minWidth: 32 }}>{formatTime(duration)}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
        <span style={{ color: "#666" }}>🔊</span>
        <input type="range" min={0} max={100} step={1} value={volume} onChange={(e) => onVolume(parseInt(e.target.value))} style={{ width: 80, accentColor: "#e8435a" }} />
      </div>
    </div>
  );
}

function Sidebar({ view, setView, playlists, selectedPlaylist, setSelectedPlaylist }) {
  const navItem = (id, label, icon) => (
    <button key={id} onClick={() => setView(id)} style={{ display: "flex", alignItems: "center", gap: 10, background: view === id ? "rgba(232,67,90,0.12)" : "none", border: "none", borderRadius: 8, cursor: "pointer", color: view === id ? "#e8435a" : "#888", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "9px 14px", width: "100%", textAlign: "left" }}>
      <span>{icon}</span> {label}
    </button>
  );
  return (
    <div style={{ width: 220, background: "#0d0d12", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "24px 12px 100px", gap: 4, overflowY: "auto" }}>
      <div style={{ color: "#e8435a", fontWeight: 800, fontSize: 22, padding: "0 14px 24px" }}>musify</div>
      {navItem("home", "Home", "🏠")}
      {navItem("library", "Your Library", "📚")}
      {navItem("liked", "Liked Songs", "♥")}
      {navItem("search", "Search", "🔍")}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "16px 0 12px", paddingTop: 16, paddingLeft: 14, color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>PLAYLISTS</div>
      {playlists.map((pl) => (
        <button key={pl.id} onClick={() => { setSelectedPlaylist(pl.id); setView("playlist"); }}
          style={{ background: view === "playlist" && selectedPlaylist === pl.id ? "rgba(255,255,255,0.06)" : "none", border: "none", borderRadius: 8, cursor: "pointer", color: view === "playlist" && selectedPlaylist === pl.id ? "#f0f0f0" : "#777", fontFamily: "inherit", fontSize: 12, padding: "8px 14px", width: "100%", textAlign: "left" }}>
          {pl.name}
        </button>
      ))}
    </div>
  );
}

function BottomNav({ view, setView }) {
  const items = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "search", label: "Search", icon: "🔍" },
    { id: "library", label: "Library", icon: "📚" },
    { id: "liked", label: "Liked", icon: "♥" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0d12", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", zIndex: 101, height: 56 }}>
      {items.map((item) => (
        <button key={item.id} onClick={() => setView(item.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: view === item.id ? "#e8435a" : "#666", fontSize: 10, fontFamily: "inherit", fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>{item.label}
        </button>
      ))}
    </div>
  );
}

function TrackRow({ track, index, isPlaying, isCurrent, onPlay, onLike, liked, isMobile, loading }) {
  const [hover, setHover] = useState(false);
  if (isMobile) return (
    <div onClick={onPlay} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.08)" : "transparent", cursor: "pointer" }}>
      <div style={{ color: isCurrent ? "#e8435a" : "#666", fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>
        {isCurrent && loading ? "⏳" : isCurrent && isPlaying ? "⏸" : "▶"}
      </div>
      <CoverArt cover={track.cover} size={44} title={track.title} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: isCurrent ? "#e8435a" : "#f0f0f0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
        <div style={{ color: "#777", fontSize: 12 }}>{track.artist}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#555", fontSize: 18, padding: 4, flexShrink: 0 }}>{liked ? "♥" : "♡"}</button>
      {track.duration > 0 && <span style={{ color: "#666", fontSize: 12, flexShrink: 0 }}>{formatTime(track.duration)}</span>}
    </div>
  );
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onDoubleClick={onPlay}
      style={{ display: "grid", gridTemplateColumns: "32px 48px 1fr 120px 40px", alignItems: "center", gap: 12, padding: "6px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.08)" : hover ? "rgba(255,255,255,0.04)" : "transparent", cursor: "pointer" }}>
      <div style={{ color: isCurrent ? "#e8435a" : "#666", fontSize: 13, textAlign: "center" }}>
        {hover || isCurrent ? <span onClick={onPlay}>{isCurrent && loading ? "⏳" : isCurrent && isPlaying ? "⏸" : "▶"}</span> : index + 1}
      </div>
      <CoverArt cover={track.cover} size={40} title={track.title} />
      <div>
        <div style={{ color: isCurrent ? "#e8435a" : "#f0f0f0", fontSize: 13, fontWeight: 600 }}>{track.title}</div>
        <div style={{ color: "#777", fontSize: 11 }}>{track.artist}</div>
      </div>
      <div style={{ color: "#666", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.album || ""}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "transparent", fontSize: 14, padding: 0, opacity: hover || liked ? 1 : 0 }}>♥</button>
        {track.duration > 0 && <span style={{ color: "#666", fontSize: 12 }}>{formatTime(track.duration)}</span>}
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ───────────────────────────────────────────────────────────────
function AdminPanel({ songs, playlists, onSave, onBack, cloudConfig, setCloudConfig }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [tab, setTab] = useState("songs"); // songs | playlists | settings
  const [songList, setSongList] = useState(songs);
  const [playlistList, setPlaylistList] = useState(playlists.filter(p => p.id !== "liked"));
  const [editingSong, setEditingSong] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [form, setForm] = useState({ title: "", artist: "", album: "", cover: "", audioUrl: "", playlist: "", youtubeId: "" });
  const [plForm, setPlForm] = useState({ name: "" });
  const [uploading, setUploading] = useState({ cover: false, audio: false });
  const [uploadErr, setUploadErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [cloudForm, setCloudForm] = useState(cloudConfig);
  const coverInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const inputStyle = { width: "100%", background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#f0f0f0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle = { color: "#888", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, display: "block" };
  const btnPrimary = { background: "#e8435a", border: "none", borderRadius: 8, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "10px 20px", cursor: "pointer" };
  const btnSecondary = { background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, color: "#aaa", fontFamily: "inherit", fontWeight: 600, fontSize: 13, padding: "10px 20px", cursor: "pointer" };

  // Login
  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 40, width: 340 }}>
        <div style={{ color: "#e8435a", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>musify</div>
        <div style={{ color: "#555", fontSize: 12, marginBottom: 28 }}>Admin Access</div>
        <label style={labelStyle}>Password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { if (pw === ADMIN_PASSWORD) setAuthed(true); else setPwErr("Wrong password"); } }}
          placeholder="Enter admin password"
          style={{ ...inputStyle, marginBottom: 8 }} />
        {pwErr && <div style={{ color: "#e8435a", fontSize: 12, marginBottom: 8 }}>{pwErr}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => { if (pw === ADMIN_PASSWORD) setAuthed(true); else setPwErr("Wrong password"); }} style={{ ...btnPrimary, flex: 1 }}>Login</button>
          <button onClick={onBack} style={btnSecondary}>← Back</button>
        </div>
      </div>
    </div>
  );

  const resetForm = () => setForm({ title: "", artist: "", album: "", cover: "", audioUrl: "", playlist: "", youtubeId: "" });

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!cloudForm.cloudName || !cloudForm.uploadPreset) {
      setUploadErr("Set Cloudinary Cloud Name and Upload Preset in Settings first.");
      return;
    }
    setUploadErr("");
    setUploading(u => ({ ...u, [type]: true }));
    try {
      const url = await uploadToCloudinary(file, cloudForm.cloudName, cloudForm.uploadPreset, type === "audio" ? "video" : "image");
      if (type === "cover") setForm(f => ({ ...f, cover: url }));
      else setForm(f => ({ ...f, audioUrl: url }));
    } catch (err) {
      setUploadErr(`Upload failed: ${err.message}`);
    }
    setUploading(u => ({ ...u, [type]: false }));
  };

  const saveSong = () => {
    if (!form.title || !form.artist) return;
    if (editingSong) {
      setSongList(list => list.map(s => s.id === editingSong ? { ...s, ...form } : s));
      setEditingSong(null);
    } else {
      setSongList(list => [...list, { ...form, id: generateId(), source: "local" }]);
    }
    resetForm();
  };

  const deleteSong = (id) => setSongList(list => list.filter(s => s.id !== id));

  const startEdit = (song) => {
    setEditingSong(song.id);
    setForm({ title: song.title, artist: song.artist, album: song.album || "", cover: song.cover || "", audioUrl: song.audioUrl || "", playlist: song.playlist || "", youtubeId: song.youtubeId || song.videoId || "" });
  };

  const savePlaylist = () => {
    if (!plForm.name) return;
    if (editingPlaylist) {
      setPlaylistList(list => list.map(p => p.id === editingPlaylist ? { ...p, name: plForm.name } : p));
      setEditingPlaylist(null);
    } else {
      setPlaylistList(list => [...list, { id: generateId(), name: plForm.name, tracks: [] }]);
    }
    setPlForm({ name: "" });
  };

  const saveAll = () => {
    setCloudConfig(cloudForm);
    onSave(songList, [{ id: "liked", name: "Liked Songs", tracks: [] }, ...playlistList]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)} style={{ ...btnSecondary, background: tab === id ? "rgba(232,67,90,0.15)" : "rgba(255,255,255,0.04)", color: tab === id ? "#e8435a" : "#888", display: "flex", alignItems: "center", gap: 6 }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Segoe UI',sans-serif", color: "#f0f0f0" }}>
      {/* Header */}
      <div style={{ background: "#0d0d12", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#e8435a", fontWeight: 800, fontSize: 20 }}>musify</span>
          <span style={{ color: "#555", fontSize: 12, background: "rgba(232,67,90,0.1)", border: "1px solid rgba(232,67,90,0.2)", borderRadius: 6, padding: "2px 8px" }}>Admin Panel</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {saved && <span style={{ color: "#4caf50", fontSize: 13, alignSelf: "center" }}>✓ Saved!</span>}
          <button onClick={saveAll} style={btnPrimary}>💾 Save Changes</button>
          <button onClick={onBack} style={btnSecondary}>← Back to App</button>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {tabBtn("songs", "Songs", "🎵")}
          {tabBtn("playlists", "Playlists", "📋")}
          {tabBtn("settings", "Cloudinary", "☁️")}
        </div>

        {/* ── SONGS TAB ── */}
        {tab === "songs" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Add/Edit Form */}
            <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: editingSong ? "#e8435a" : "#f0f0f0" }}>
                {editingSong ? "✏️ Edit Song" : "➕ Add Song"}
              </div>

              {uploadErr && <div style={{ background: "rgba(232,67,90,0.1)", border: "1px solid rgba(232,67,90,0.3)", borderRadius: 8, padding: "10px 14px", color: "#e8435a", fontSize: 12, marginBottom: 16 }}>{uploadErr}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Song Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Aromalinte Azhakulla" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Artist *</label>
                  <input value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} placeholder="e.g. K.J. Yesudas" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Album</label>
                  <input value={form.album} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} placeholder="Album name (optional)" style={inputStyle} />
                </div>

                {/* Cover Upload */}
                <div>
                  <label style={labelStyle}>Cover Image</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={form.cover} onChange={e => setForm(f => ({ ...f, cover: e.target.value }))} placeholder="Cloudinary URL or upload ↓" style={{ ...inputStyle, flex: 1 }} />
                    {form.cover && <img src={form.cover} alt="cover" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={e => handleUpload(e, "cover")} style={{ display: "none" }} />
                  <button onClick={() => coverInputRef.current?.click()} style={{ ...btnSecondary, marginTop: 8, fontSize: 12, padding: "7px 14px" }} disabled={uploading.cover}>
                    {uploading.cover ? "⏳ Uploading..." : "📷 Upload Cover"}
                  </button>
                </div>

                {/* Audio Upload */}
                <div>
                  <label style={labelStyle}>Audio File (Cloudinary)</label>
                  <input value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="Cloudinary audio URL or upload ↓" style={inputStyle} />
                  <input ref={audioInputRef} type="file" accept="audio/*" onChange={e => handleUpload(e, "audio")} style={{ display: "none" }} />
                  <button onClick={() => audioInputRef.current?.click()} style={{ ...btnSecondary, marginTop: 8, fontSize: 12, padding: "7px 14px" }} disabled={uploading.audio}>
                    {uploading.audio ? "⏳ Uploading..." : "🎵 Upload Audio"}
                  </button>
                  {form.audioUrl && <div style={{ color: "#4caf50", fontSize: 11, marginTop: 4 }}>✓ Audio URL set</div>}
                </div>

                {/* YouTube fallback */}
                <div>
                  <label style={labelStyle}>YouTube Video ID (fallback)</label>
                  <input value={form.youtubeId} onChange={e => setForm(f => ({ ...f, youtubeId: e.target.value }))} placeholder="e.g. dQw4w9WgXcQ" style={inputStyle} />
                  <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>Used if no audio URL. From youtube.com/watch?v=THIS</div>
                </div>

                {/* Playlist assign */}
                <div>
                  <label style={labelStyle}>Add to Playlist</label>
                  <select value={form.playlist} onChange={e => setForm(f => ({ ...f, playlist: e.target.value }))} style={{ ...inputStyle }}>
                    <option value="">None</option>
                    {playlistList.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={saveSong} style={{ ...btnPrimary, flex: 1 }}>{editingSong ? "Update Song" : "Add Song"}</button>
                  {editingSong && <button onClick={() => { setEditingSong(null); resetForm(); }} style={btnSecondary}>Cancel</button>}
                </div>
              </div>
            </div>

            {/* Song List */}
            <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🎵 Songs ({songList.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
                {songList.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>No songs yet. Add your first song!</div>}
                {songList.map(song => (
                  <div key={song.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: editingSong === song.id ? "1px solid rgba(232,67,90,0.4)" : "1px solid transparent" }}>
                    <CoverArt cover={song.cover} size={38} title={song.title} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                      <div style={{ color: "#777", fontSize: 11 }}>{song.artist}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        {song.audioUrl && <span style={{ background: "rgba(76,175,80,0.15)", color: "#4caf50", fontSize: 10, borderRadius: 4, padding: "1px 5px" }}>☁️ Audio</span>}
                        {(song.youtubeId || song.videoId) && <span style={{ background: "rgba(255,0,0,0.1)", color: "#ff6b6b", fontSize: 10, borderRadius: 4, padding: "1px 5px" }}>▶ YT</span>}
                      </div>
                    </div>
                    <button onClick={() => startEdit(song)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, padding: 4 }}>✏️</button>
                    <button onClick={() => deleteSong(song.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e8435a", fontSize: 14, padding: 4 }}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAYLISTS TAB ── */}
        {tab === "playlists" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{editingPlaylist ? "✏️ Edit Playlist" : "➕ New Playlist"}</div>
              <label style={labelStyle}>Playlist Name *</label>
              <input value={plForm.name} onChange={e => setPlForm({ name: e.target.value })} placeholder="e.g. Malayalam Hits" style={{ ...inputStyle, marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={savePlaylist} style={{ ...btnPrimary, flex: 1 }}>{editingPlaylist ? "Update" : "Create Playlist"}</button>
                {editingPlaylist && <button onClick={() => { setEditingPlaylist(null); setPlForm({ name: "" }); }} style={btnSecondary}>Cancel</button>}
              </div>
            </div>
            <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📋 Playlists ({playlistList.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>♥</span>
                  <div style={{ flex: 1, color: "#f0f0f0", fontSize: 13, fontWeight: 600 }}>Liked Songs</div>
                  <span style={{ color: "#555", fontSize: 11 }}>Built-in</span>
                </div>
                {playlistList.map(pl => (
                  <div key={pl.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}>📋</span>
                    <div style={{ flex: 1, color: "#f0f0f0", fontSize: 13, fontWeight: 600 }}>{pl.name}</div>
                    <span style={{ color: "#555", fontSize: 11 }}>{songList.filter(s => s.playlist === pl.id).length} songs</span>
                    <button onClick={() => { setEditingPlaylist(pl.id); setPlForm({ name: pl.name }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, padding: 4 }}>✏️</button>
                    <button onClick={() => setPlaylistList(list => list.filter(p => p.id !== pl.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#e8435a", fontSize: 14, padding: 4 }}>🗑️</button>
                  </div>
                ))}
                {playlistList.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>No custom playlists yet.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 28 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>☁️ Cloudinary Settings</div>
              <div style={{ color: "#555", fontSize: 12, marginBottom: 24 }}>Required for direct file uploads from admin panel.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Cloud Name</label>
                  <input value={cloudForm.cloudName} onChange={e => setCloudForm(f => ({ ...f, cloudName: e.target.value }))} placeholder="e.g. my-cloud" style={inputStyle} />
                  <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>Found in Cloudinary Dashboard → Settings</div>
                </div>
                <div>
                  <label style={labelStyle}>Upload Preset</label>
                  <input value={cloudForm.uploadPreset} onChange={e => setCloudForm(f => ({ ...f, uploadPreset: e.target.value }))} placeholder="e.g. musify_uploads" style={inputStyle} />
                  <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>Settings → Upload → Upload Presets → Create unsigned preset</div>
                </div>
                <div style={{ background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ color: "#ffc107", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📋 How to create an upload preset:</div>
                  <div style={{ color: "#aaa", fontSize: 11, lineHeight: 1.7 }}>
                    1. Go to cloudinary.com → Settings<br />
                    2. Click Upload → Upload Presets<br />
                    3. Add Upload Preset → set Signing Mode to <b style={{ color: "#ffc107" }}>Unsigned</b><br />
                    4. Copy the preset name here
                  </div>
                </div>
                <button onClick={() => { setCloudConfig(cloudForm); setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={btnPrimary}>Save Cloudinary Config</button>
                {saved && <div style={{ color: "#4caf50", fontSize: 13 }}>✓ Saved!</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function Musify() {
  const [route, setRoute] = useState(window.location.hash === "#admin" ? "admin" : "app");
  const [view, setView] = useState("home");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likedTracks, setLikedTracksArr] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [featuredTracks, setFeaturedTracks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [playlists, setPlaylists] = useState([{ id: "liked", name: "Liked Songs", tracks: [] }]);
  const [queue, setQueue] = useState([]);
  // Admin-managed songs (Cloudinary)
  const [adminSongs, setAdminSongs] = useState([]);
  const [cloudConfig, setCloudConfig] = useState({ cloudName: "", uploadPreset: "" });

  const searchTimeout = useRef(null);
  const isMobile = useIsMobile();

  // Detect /admin route via hash
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash === "#admin" ? "admin" : "app");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // YouTube player (for non-Cloudinary tracks)
  const handleEnded = useCallback(() => handleNext(), []);
  const yt = useYouTubePlayer(handleEnded);
  // Audio player (for Cloudinary tracks)
  const audio = useAudioPlayer(handleEnded);

  // Load home data
  useEffect(() => {
    const load = async () => {
      setLoadingHome(true);
      const [spotifyTracks, releases, featured] = await Promise.all([
        searchSpotifyTracks("top malayalam hits"),
        getSpotifyNewReleases(),
        getSpotifyFeatured(),
      ]);
      setFeaturedTracks(spotifyTracks.length > 0 ? spotifyTracks : await searchItunesForYT("top hits 2024"));
      setNewReleases(releases);
      setSpotifyPlaylists(featured);
      setLoadingHome(false);
    };
    load();
  }, []);

  // Live search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimeout.current);
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      // Search admin songs first
      const localMatches = adminSongs.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
      );
      // Then search online
      const onlineResults = await searchSpotifyTracks(search);
      setSearchResults([...localMatches, ...onlineResults]);
      setSearching(false);
    }, 400);
  }, [search, adminSongs]);

  // Get video ID without API key
  const getVideoIdFromQuery = async (query) => {
    try {
      const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)}`);
      const text = await res.text();
      const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      return match ? match[1] : null;
    } catch { return null; }
  };

  const handlePlay = useCallback(async (track, trackList = []) => {
    // Cloudinary audio track
    if (track.audioUrl) {
      if (currentTrack?.id === track.id) {
        if (isPlaying) { audio.pause(); setIsPlaying(false); }
        else { audio.play(); setIsPlaying(true); }
        return;
      }
      // Pause YouTube if playing
      yt.pause();
      setCurrentTrack(track);
      setIsPlaying(true);
      setLoadingTrack(false);
      if (trackList.length > 0) setQueue(trackList);
      audio.loadAudio(track.audioUrl);
      return;
    }

    // YouTube track
    if (!yt.ready) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) { yt.pause(); setIsPlaying(false); }
      else { yt.play(); setIsPlaying(true); }
      return;
    }
    audio.pause();
    setCurrentTrack(track);
    setIsPlaying(false);
    setLoadingTrack(true);
    if (trackList.length > 0) setQueue(trackList);

    let videoId = track.videoId || track.youtubeId;
    if (!videoId) {
      const query = track.searchQuery || `${track.title} ${track.artist} official audio`;
      videoId = await getVideoIdFromQuery(query);
    }
    if (videoId) { yt.loadVideo(videoId); setIsPlaying(true); }
    setLoadingTrack(false);
  }, [yt, audio, currentTrack, isPlaying]);

  const currentQueue = queue.length > 0 ? queue : [...adminSongs, ...featuredTracks];

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const idx = currentQueue.findIndex(t => t.id === currentTrack.id);
    const next = currentQueue[(idx + 1) % currentQueue.length];
    if (next) handlePlay(next, currentQueue);
  }, [currentTrack, currentQueue, handlePlay]);

  const handlePrev = useCallback(() => {
    if (!currentTrack) return;
    const prog = currentTrack.audioUrl ? audio.progress : yt.progress;
    if (prog > 3) { currentTrack.audioUrl ? audio.seek(0) : yt.seek(0); return; }
    const idx = currentQueue.findIndex(t => t.id === currentTrack.id);
    const prev = currentQueue[(idx - 1 + currentQueue.length) % currentQueue.length];
    if (prev) handlePlay(prev, currentQueue);
  }, [currentTrack, currentQueue, yt, audio, handlePlay]);

  const handleLike = (track) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(track.id)) { next.delete(track.id); setLikedTracksArr(arr => arr.filter(t => t.id !== track.id)); }
      else { next.add(track.id); setLikedTracksArr(arr => [...arr, track]); }
      return next;
    });
  };

  // Admin save callback
  const handleAdminSave = (songs, pls) => {
    setAdminSongs(songs);
    setPlaylists(pls);
  };

  const mobilePadBottom = currentTrack ? 160 : 70;

  // Determine progress/duration/volume based on active player
  const activeProgress = currentTrack?.audioUrl ? audio.progress : yt.progress;
  const activeDuration = currentTrack?.audioUrl ? audio.duration : yt.duration;
  const activeVolume = currentTrack?.audioUrl ? audio.volume : yt.volume;
  const activeSeek = currentTrack?.audioUrl ? audio.seek : yt.seek;
  const activeSetVol = currentTrack?.audioUrl ? audio.setVol : yt.setVol;

  const trackRowProps = (track, index, list) => ({
    track, index, isPlaying, isCurrent: currentTrack?.id === track.id,
    onPlay: () => handlePlay(track, list),
    liked: likedIds.has(track.id), onLike: () => handleLike(track),
    isMobile, loading: loadingTrack && currentTrack?.id === track.id,
  });

  // Playlist tracks
  const getPlaylistTracks = (plId) => adminSongs.filter(s => s.playlist === plId);

  // ── ADMIN ROUTE ──
  if (route === "admin") return (
    <AdminPanel
      songs={adminSongs}
      playlists={playlists}
      onSave={handleAdminSave}
      onBack={() => { window.location.hash = ""; setRoute("app"); }}
      cloudConfig={cloudConfig}
      setCloudConfig={setCloudConfig}
    />
  );

  // ── MAIN APP ──
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0f", fontFamily: "'Segoe UI',sans-serif", color: "#f0f0f0", overflow: "hidden" }}>
      {/* Hidden YouTube player */}
      <div ref={yt.containerRef} style={{ position: "fixed", top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: "none", zIndex: -1 }} />

      {!isMobile && <Sidebar view={view} setView={setView} playlists={playlists} selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist} />}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? mobilePadBottom : 100 }}>
        {isMobile && (
          <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e8435a", fontWeight: 800, fontSize: 24 }}>musify</div>
            <div style={{ color: "#555", fontSize: 11 }}></div>
          </div>
        )}

        {/* HOME */}
        {view === "home" && (
          <div style={{ padding: isMobile ? "12px 16px" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4 }}>Good evening 🎵</h2>
            <p style={{ color: "#555", fontSize: 12, marginBottom: 24 }}>Full songs via YouTube & Cloudinary • Search any song</p>

            {/* Admin songs section */}
            {adminSongs.length > 0 && (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>☁️ My Collection</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(150px,1fr))", gap: isMobile ? 10 : 14, marginBottom: 28 }}>
                  {adminSongs.map(t => (
                    <div key={t.id} onClick={() => handlePlay(t, adminSongs)}
                      style={{ background: "#1a1a22", borderRadius: 12, padding: isMobile ? 10 : 14, cursor: "pointer", border: `1px solid ${currentTrack?.id === t.id ? "rgba(232,67,90,0.5)" : "rgba(255,255,255,0.06)"}` }}>
                      <CoverArt cover={t.cover} size={isMobile ? "100%" : 120} title={t.title} />
                      <div style={{ color: currentTrack?.id === t.id ? "#e8435a" : "#f0f0f0", fontWeight: 700, fontSize: 13, marginTop: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                      <div style={{ color: "#888", fontSize: 11, marginTop: 3 }}>{t.artist}</div>
                      <div style={{ color: "#4caf50", fontSize: 10, marginTop: 2 }}>☁️ Cloudinary</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🎵 Top Malayalam Hits</h3>
            {loadingHome ? <div style={{ color: "#555" }}>Loading...</div> : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(150px,1fr))", gap: isMobile ? 10 : 14 }}>
                {featuredTracks.slice(0, 12).map(t => (
                  <div key={t.id} onClick={() => handlePlay(t, featuredTracks)}
                    style={{ background: "#1a1a22", borderRadius: 12, padding: isMobile ? 10 : 14, cursor: "pointer", border: `1px solid ${currentTrack?.id === t.id ? "rgba(232,67,90,0.5)" : "rgba(255,255,255,0.06)"}` }}>
                    <CoverArt cover={t.cover} size={isMobile ? "100%" : 120} title={t.title} />
                    <div style={{ color: currentTrack?.id === t.id ? "#e8435a" : "#f0f0f0", fontWeight: 700, fontSize: 13, marginTop: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div style={{ color: "#888", fontSize: 11, marginTop: 3 }}>{t.artist}</div>
                  </div>
                ))}
              </div>
            )}

            {newReleases.length > 0 && (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "28px 0 14px" }}>🆕 New Releases</h3>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                  {newReleases.map(t => (
                    <div key={t.id} onClick={() => handlePlay(t, newReleases)}
                      style={{ background: "#1a1a22", borderRadius: 12, padding: 10, minWidth: 130, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, cursor: "pointer" }}>
                      <CoverArt cover={t.cover} size={110} title={t.title} />
                      <div style={{ color: "#f0f0f0", fontWeight: 600, fontSize: 12, marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                      <div style={{ color: "#888", fontSize: 11 }}>{t.artist}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {spotifyPlaylists.length > 0 && (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "28px 0 14px" }}>🎧 Featured Playlists</h3>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                  {spotifyPlaylists.map(p => (
                    <div key={p.id} onClick={() => { setSearch(p.name); setView("search"); }}
                      style={{ background: "#1a1a22", borderRadius: 12, padding: 10, minWidth: 130, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, cursor: "pointer" }}>
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} style={{ width: 110, height: 110, borderRadius: 8, objectFit: "cover" }} />}
                      <div style={{ color: "#f0f0f0", fontWeight: 600, fontSize: 12, marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* LIBRARY */}
        {view === "library" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>Your Library</h2>
            {adminSongs.length > 0 && (
              <>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 700, padding: isMobile ? "0 16px" : "0 0 8px", marginBottom: 8, letterSpacing: 1 }}>☁️ MY COLLECTION</div>
                {adminSongs.map((t, i) => <TrackRow key={t.id} {...trackRowProps(t, i, adminSongs)} />)}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "16px 0" }} />
              </>
            )}
            {loadingHome ? <div style={{ color: "#555", padding: 16 }}>Loading...</div>
              : featuredTracks.map((t, i) => <TrackRow key={t.id} {...trackRowProps(t, i, featuredTracks)} />)}
          </div>
        )}

        {/* LIKED */}
        {view === "liked" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>♥ Liked Songs</h2>
            {likedTracks.length === 0
              ? <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>No liked songs yet. Tap ♡ on any song!</div>
              : likedTracks.map((t, i) => <TrackRow key={t.id} {...trackRowProps(t, i, likedTracks)} />)}
          </div>
        )}

        {/* SEARCH */}
        {view === "search" && (
          <div style={{ padding: isMobile ? "12px 16px" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 16 }}>Search</h2>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any song, artist..."
              style={{ width: "100%", maxWidth: isMobile ? "100%" : 480, background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "12px 20px", color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ marginTop: 20 }}>
              {searching && <div style={{ color: "#555", fontSize: 13 }}>Searching...</div>}
              {!searching && search && searchResults.length === 0 && <div style={{ color: "#555" }}>No results found.</div>}
              {searchResults.map((t, i) => <TrackRow key={t.id} {...trackRowProps(t, i, searchResults)} />)}
            </div>
          </div>
        )}

        {/* PLAYLIST */}
        {view === "playlist" && selectedPlaylist === "liked" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>♥ Liked Songs</h2>
            {likedTracks.length === 0
              ? <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>No liked songs yet!</div>
              : likedTracks.map((t, i) => <TrackRow key={t.id} {...trackRowProps(t, i, likedTracks)} />)}
          </div>
        )}

        {view === "playlist" && selectedPlaylist && selectedPlaylist !== "liked" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>
              📋 {playlists.find(p => p.id === selectedPlaylist)?.name || "Playlist"}
            </h2>
            {getPlaylistTracks(selectedPlaylist).length === 0
              ? <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>No songs in this playlist yet. Add them from the admin panel.</div>
              : getPlaylistTracks(selectedPlaylist).map((t, i) => <TrackRow key={t.id} {...trackRowProps(t, i, getPlaylistTracks(selectedPlaylist))} />)}
          </div>
        )}
      </div>

      <PlayerBar
        track={currentTrack} isPlaying={isPlaying} loading={loadingTrack}
        onToggle={() => {
          if (!currentTrack) return;
          if (currentTrack.audioUrl) { if (isPlaying) { audio.pause(); setIsPlaying(false); } else { audio.play(); setIsPlaying(true); } }
          else { if (isPlaying) { yt.pause(); setIsPlaying(false); } else { yt.play(); setIsPlaying(true); } }
        }}
        progress={activeProgress} duration={activeDuration}
        onSeek={activeSeek} onNext={handleNext} onPrev={handlePrev}
        volume={activeVolume} onVolume={activeSetVol}
        liked={currentTrack ? likedIds.has(currentTrack.id) : false}
        onLike={() => currentTrack && handleLike(currentTrack)}
        isMobile={isMobile}
      />

      {isMobile && <BottomNav view={view} setView={setView} />}
    </div>
  );
}