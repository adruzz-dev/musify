cat > /mnt/user-data/outputs/Musify.jsx << 'ENDOFFILE'
import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, sendEmailVerification,
  onAuthStateChanged, signOut
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs
} from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDUZ3YuWky2VP-gN2PyrARig21qJquzc68",
  authDomain: "musify-39617.firebaseapp.com",
  projectId: "musify-39617",
  storageBucket: "musify-39617.firebasestorage.app",
  messagingSenderId: "926623581276",
  appId: "1:926623581276:web:d5ae4301224b1506ab1299",
  measurementId: "G-VLPDWD4CTL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED SONGS — add your songs here manually
// ─────────────────────────────────────────────────────────────────────────────
const ALL_SONGS = [
  {
    id: "song-1",
    title: "Vaisakha Sandhye",
    artist: "K.J. Yesudas",
    album: "Kerala Classics",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779530849/images_p3p8bd.jpg",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779531012/Vaisakha_Sandhye_HD_Video_Song_Mohanlal_Shobana_-_Nadodikkattu_-_Saina_Music_youtube_u2fvmk.mp3",
    playlist: "playlist-1",
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
  // ── ADD MORE SONGS BELOW ──
  // {
  //   id: "song-4",
  //   title: "Song Title",
  //   artist: "Artist Name",
  //   album: "Album Name",
  //   cover: "https://res.cloudinary.com/dasnicvlp/image/upload/...",
  //   audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/...",
  //   playlist: "playlist-1",
  // },
];

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED PLAYLISTS (admin playlists, visible to all)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_PLAYLISTS = [
  { id: "playlist-1", name: "Malayalam Hits", cover: "" },
  { id: "playlist-2", name: "Chill Vibes", cover: "" },
  // { id: "playlist-3", name: "Party Mix", cover: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE USER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getUserDoc = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

const createUserDoc = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    name: data.name || "",
    email: data.email || "",
    playlists: [],
    likedSongs: [],
    createdAt: Date.now(),
  });
};

const saveUserPlaylist = async (uid, playlist) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { playlists: arrayUnion(playlist) });
};

const deleteUserPlaylist = async (uid, playlist) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { playlists: arrayRemove(playlist) });
};

const saveUserLiked = async (uid, likedSongs) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { likedSongs });
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

function generateId() {
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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
    audioRef.current.addEventListener("timeupdate", () => setProgress(audioRef.current.currentTime));
    audioRef.current.addEventListener("loadedmetadata", () => setDuration(audioRef.current.duration));
    return () => { audioRef.current?.pause(); audioRef.current = null; };
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
    play: () => audioRef.current?.play(),
    pause: () => audioRef.current?.pause(),
    seek: (r) => { if (audioRef.current) audioRef.current.currentTime = r * (audioRef.current.duration || 0); },
    setVol: (v) => { const val = v / 100; setVolume(val); if (audioRef.current) audioRef.current.volume = val; },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER ART
// ─────────────────────────────────────────────────────────────────────────────
function CoverArt({ cover, size = 48, title, radius = 8 }) {
  const initials = title?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "♪";
  const sz = typeof size === "number" ? size : "100%";
  return cover ? (
    <img src={cover} alt={title} style={{ width: sz, height: sz, borderRadius: radius, objectFit: "cover", flexShrink: 0, display: "block" }} />
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
      style={{ flex: 1, height: isMobile ? 3 : 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer" }}>
      <div style={{ width: pct, height: "100%", background: "#e8435a", borderRadius: 2, transition: "width 0.2s" }} />
    </div>
  );
  const controls = (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 20 }}>
      <button onClick={onPrev} style={{ background: "none", border: "none", cursor: "pointer", color: "#777", fontSize: isMobile ? 16 : 18, padding: 4 }}>⏮</button>
      <button onClick={onToggle} style={{ width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, borderRadius: "50%", background: "#e8435a", border: "none", cursor: "pointer", color: "#fff", fontSize: isMobile ? 13 : 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        <input type="range" min={0} max={100} step={1} value={volume} onChange={e => onVolume(+e.target.value)} style={{ width: 80, accentColor: "#e8435a", cursor: "pointer" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, userPlaylists, selectedPlaylist, setSelectedPlaylist, user, onLogout }) {
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
      {nav("home", "Home", "🏠")}
      {nav("library", "Your Library", "📚")}
      {nav("liked", "Liked Songs", "♥")}
      {nav("search", "Search", "🔍")}
      {userPlaylists.length > 0 && (
        <>
          <div style={{ margin: "14px 0 10px", paddingLeft: 14, color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: 1, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 }}>MY PLAYLISTS</div>
          {userPlaylists.map(pl => (
            <button key={pl.id} onClick={() => { setSelectedPlaylist(pl.id); setView("userplaylist"); }} style={{
              background: view === "userplaylist" && selectedPlaylist === pl.id ? "rgba(255,255,255,0.05)" : "none",
              border: "none", borderRadius: 8, cursor: "pointer", padding: "8px 14px",
              color: view === "userplaylist" && selectedPlaylist === pl.id ? "#ccc" : "#666",
              fontFamily: "inherit", fontSize: 12, width: "100%", textAlign: "left",
            }}>
              🎵 {pl.name}
            </button>
          ))}
        </>
      )}
      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ paddingLeft: 14, color: "#555", fontSize: 11, marginBottom: 8 }}>👤 {user?.displayName || user?.email}</div>
        <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: "inherit", fontSize: 12, padding: "8px 14px", width: "100%", textAlign: "left" }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
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
function TrackRow({ track, index, isPlaying, isCurrent, onPlay, onLike, liked, isMobile, onAddToPlaylist }) {
  const [hover, setHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const playIcon = isCurrent && isPlaying ? "⏸" : "▶";

  if (isMobile) return (
    <div style={{ position: "relative" }}>
      <div onClick={onPlay} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.07)" : "transparent", cursor: "pointer" }}>
        <div style={{ color: isCurrent ? "#e8435a" : "#555", fontSize: 12, width: 18, textAlign: "center", flexShrink: 0 }}>{playIcon}</div>
        <CoverArt cover={track.cover} size={42} title={track.title} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isCurrent ? "#e8435a" : "#efefef", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{track.artist}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#444", fontSize: 17, padding: 4, flexShrink: 0 }}>{liked ? "♥" : "♡"}</button>
        {onAddToPlaylist && <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 16, padding: 4 }}>⋮</button>}
      </div>
      {showMenu && onAddToPlaylist && (
        <div style={{ position: "absolute", right: 16, top: "100%", background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 4, zIndex: 200, minWidth: 160 }}>
          <div onClick={() => { onAddToPlaylist(track); setShowMenu(false); }} style={{ padding: "8px 12px", color: "#efefef", fontSize: 12, cursor: "pointer", borderRadius: 6 }}>➕ Add to playlist</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onDoubleClick={onPlay}
        style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr 130px 60px", alignItems: "center", gap: 12, padding: "6px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.07)" : hover ? "rgba(255,255,255,0.03)" : "transparent", cursor: "pointer" }}>
        <div style={{ color: isCurrent ? "#e8435a" : "#555", fontSize: 12, textAlign: "center" }}>
          {(hover || isCurrent) ? <span onClick={onPlay}>{playIcon}</span> : index + 1}
        </div>
        <CoverArt cover={track.cover} size={40} title={track.title} />
        <div>
          <div style={{ color: isCurrent ? "#e8435a" : "#efefef", fontSize: 13, fontWeight: 600 }}>{track.title}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 1 }}>{track.artist}</div>
        </div>
        <div style={{ color: "#555", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.album || ""}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "transparent", fontSize: 13, padding: 0, opacity: hover || liked ? 1 : 0 }}>♥</button>
          {onAddToPlaylist && <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 16, padding: 0, opacity: hover ? 1 : 0 }}>⋮</button>}
        </div>
      </div>
      {showMenu && onAddToPlaylist && (
        <div style={{ position: "absolute", right: 16, top: "100%", background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 4, zIndex: 200, minWidth: 160 }}>
          <div onClick={() => { onAddToPlaylist(track); setShowMenu(false); }} style={{ padding: "8px 12px", color: "#efefef", fontSize: 12, cursor: "pointer", borderRadius: 6 }}>➕ Add to playlist</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SONG CARD
// ─────────────────────────────────────────────────────────────────────────────
function SongCard({ track, isCurrent, isPlaying, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: isCurrent ? "rgba(232,67,90,0.1)" : hover ? "rgba(255,255,255,0.04)" : "#111118",
        borderRadius: 12, padding: isMobile ? 10 : 14, cursor: "pointer",
        border: `1px solid ${isCurrent ? "rgba(232,67,90,0.35)" : "rgba(255,255,255,0.05)"}`,
        transition: "all 0.15s", position: "relative",
      }}>
      <div style={{ position: "relative" }}>
        <CoverArt cover={track.cover} size={isMobile ? "100%" : 120} title={track.title} radius={10} />
        {(hover || isCurrent) && (
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
// ADD TO PLAYLIST MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddToPlaylistModal({ track, userPlaylists, onAdd, onCreateAndAdd, onClose }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ color: "#efefef", fontWeight: 700, fontSize: 15 }}>Add to Playlist</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ color: "#666", fontSize: 12, marginBottom: 14 }}>"{track.title}"</div>

        {userPlaylists.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>YOUR PLAYLISTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {userPlaylists.map(pl => (
                <div key={pl.id} onClick={() => onAdd(pl.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 16 }}>🎵</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#efefef", fontSize: 13, fontWeight: 600 }}>{pl.name}</div>
                    <div style={{ color: "#555", fontSize: 11 }}>{pl.songs?.length || 0} songs</div>
                  </div>
                  <span style={{ color: "#e8435a", fontSize: 18 }}>+</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
          <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>CREATE NEW PLAYLIST</div>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Playlist name…"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#f0f0f0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
          <button onClick={() => { if (newName.trim()) { onCreateAndAdd(newName.trim(), track); } }} disabled={!newName.trim()}
            style={{ width: "100%", background: newName.trim() ? "#e8435a" : "#333", border: "none", borderRadius: 8, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "11px 0", cursor: newName.trim() ? "pointer" : "not-allowed" }}>
            ➕ Create & Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 16px", color: "#f0f0f0", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  const handleEmailAuth = async () => {
    setErr(""); setInfo("");
    if (!email.trim() || !pw.trim()) { setErr("Email and password are required."); return; }
    if (mode === "signup") {
      if (!name.trim()) { setErr("Please enter your name."); return; }
      if (pw !== confirmPw) { setErr("Passwords do not match."); return; }
      if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
        await sendEmailVerification(cred.user);
        await createUserDoc(cred.user.uid, { name: name.trim(), email: email.trim() });
        setInfo("✉️ Verification email sent! Please check your inbox and verify before logging in.");
        setMode("login");
        setName(""); setPw(""); setConfirmPw("");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), pw);
        if (!cred.user.emailVerified) {
          await signOut(auth);
          setErr("Please verify your email first. Check your inbox.");
          setLoading(false); return;
        }
        onAuthSuccess(cred.user);
      }
    } catch (e) {
      const msg = e.code === "auth/user-not-found" ? "No account with this email." :
        e.code === "auth/wrong-password" ? "Incorrect password." :
        e.code === "auth/email-already-in-use" ? "Email already registered." :
        e.code === "auth/invalid-email" ? "Invalid email address." :
        "Something went wrong. Try again.";
      setErr(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUserDoc(cred.user.uid);
      if (!existing) {
        await createUserDoc(cred.user.uid, { name: cred.user.displayName, email: cred.user.email });
      }
      onAuthSuccess(cred.user);
    } catch (e) {
      setErr("Google sign-in failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#090912", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: 16,
      backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,67,90,0.18) 0%, transparent 70%)",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ color: "#e8435a", fontWeight: 900, fontSize: 36, letterSpacing: -1, lineHeight: 1 }}>musify</div>
          <div style={{ color: "#444", fontSize: 13, marginTop: 6 }}>Your music, your world</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "32px 28px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); setInfo(""); }} style={{
                flex: 1, background: mode === m ? "#e8435a" : "none", border: "none", borderRadius: 8,
                padding: "8px 0", cursor: "pointer", color: mode === m ? "#fff" : "#666",
                fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "all 0.2s",
              }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {info && <div style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 8, padding: "10px 14px", color: "#4caf50", fontSize: 12, marginBottom: 14 }}>{info}</div>}
          {err && <div style={{ background: "rgba(232,67,90,0.1)", border: "1px solid rgba(232,67,90,0.25)", borderRadius: 8, padding: "10px 14px", color: "#e8435a", fontSize: 12, marginBottom: 14 }}>{err}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={inp} />
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" style={inp}
              onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
            {mode === "signup" && (
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm password" style={inp}
                onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
            )}
            <button onClick={handleEmailAuth} disabled={loading} style={{
              background: loading ? "#6a1e2a" : "#e8435a", border: "none", borderRadius: 10,
              color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
              padding: "13px 0", cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
            }}>
              {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ color: "#444", fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <button onClick={handleGoogle} disabled={loading} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, color: "#efefef", fontFamily: "inherit", fontWeight: 600, fontSize: 14,
              padding: "12px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
        {mode === "signup" && (
          <div style={{ textAlign: "center", color: "#444", fontSize: 11, marginTop: 14 }}>
            A verification email will be sent after signup.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function Musify() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [search, setSearch] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likedTracks, setLikedTracksArr] = useState([]);
  const [queue, setQueue] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null);
  const [userData, setUserData] = useState(null);

  const isMobile = useIsMobile();

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && u.emailVerified) {
        setUser(u);
        const data = await getUserDoc(u.uid);
        if (data) {
          setUserData(data);
          setUserPlaylists(data.playlists || []);
          const liked = data.likedSongs || [];
          setLikedIds(new Set(liked.map(s => s.id)));
          setLikedTracksArr(liked);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleEnded = useCallback(() => {
    const q = queue.length > 0 ? queue : ALL_SONGS;
    const idx = q.findIndex(t => t.id === currentTrack?.id);
    const next = q[(idx + 1) % q.length];
    if (next) playTrack(next, q);
  }, [currentTrack, queue]);

  const audio = useAudioPlayer(handleEnded);

  const handleAuthSuccess = async (u) => {
    setUser(u);
    const data = await getUserDoc(u.uid);
    if (data) {
      setUserData(data);
      setUserPlaylists(data.playlists || []);
      const liked = data.likedSongs || [];
      setLikedIds(new Set(liked.map(s => s.id)));
      setLikedTracksArr(liked);
    } else {
      await createUserDoc(u.uid, { name: u.displayName || "", email: u.email });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setUserPlaylists([]);
    setLikedIds(new Set());
    setLikedTracksArr([]);
    audio.pause();
  };

  // Play
  const playTrack = useCallback((track, trackList = []) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play(); setIsPlaying(true); }
      return;
    }
    if (!track.audioUrl) return;
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

  // Like
  const handleLike = async (track) => {
    const next = new Set(likedIds);
    let nextArr;
    if (next.has(track.id)) {
      next.delete(track.id);
      nextArr = likedTracks.filter(t => t.id !== track.id);
    } else {
      next.add(track.id);
      nextArr = [...likedTracks, track];
    }
    setLikedIds(next);
    setLikedTracksArr(nextArr);
    if (user) await saveUserLiked(user.uid, nextArr);
  };

  // User playlists
  const handleCreateAndAdd = async (name, track) => {
    const newPl = { id: generateId(), name, songs: [track] };
    const updated = [...userPlaylists, newPl];
    setUserPlaylists(updated);
    if (user) await saveUserPlaylist(user.uid, newPl);
    setAddToPlaylistTrack(null);
  };

  const handleAddToExisting = async (plId, track) => {
    const updated = userPlaylists.map(pl => {
      if (pl.id !== plId) return pl;
      const already = pl.songs?.some(s => s.id === track.id);
      if (already) return pl;
      return { ...pl, songs: [...(pl.songs || []), track] };
    });
    setUserPlaylists(updated);
    if (user) {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { playlists: updated });
    }
    setAddToPlaylistTrack(null);
  };

  const handleDeleteUserPlaylist = async (plId) => {
    const pl = userPlaylists.find(p => p.id === plId);
    const updated = userPlaylists.filter(p => p.id !== plId);
    setUserPlaylists(updated);
    if (user && pl) await deleteUserPlaylist(user.uid, pl);
    setView("library");
  };

  const rowProps = (track, i, list) => ({
    track, index: i, isPlaying, isCurrent: currentTrack?.id === track.id,
    onPlay: () => playTrack(track, list),
    liked: likedIds.has(track.id), onLike: () => handleLike(track),
    isMobile,
    onAddToPlaylist: (t) => setAddToPlaylistTrack(t),
  });

  const searchResults = search.trim()
    ? ALL_SONGS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase()) ||
        (s.album || "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const adminPlaylistSongs = (plId) => ALL_SONGS.filter(s => s.playlist === plId);
  const mobilePad = currentTrack ? 168 : 72;

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#090912", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#e8435a", fontWeight: 900, fontSize: 28 }}>musify</div>
    </div>
  );

  if (!user) return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#090912", fontFamily: "'Segoe UI', sans-serif", color: "#f0f0f0", overflow: "hidden" }}>

      {!isMobile && (
        <Sidebar
          view={view} setView={setView}
          userPlaylists={userPlaylists}
          selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist}
          user={user} onLogout={handleLogout}
        />
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? mobilePad : 110 }}>

        {isMobile && (
          <div style={{ padding: "18px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e8435a", fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>musify</div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 12 }}>Logout</button>
          </div>
        )}

        {/* ── HOME ── */}
        {view === "home" && (
          <div style={{ padding: isMobile ? "12px 16px" : "28px 32px" }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4, marginTop: 0 }}>{getGreeting()} 🎵</h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 28, marginTop: 0 }}>Welcome back, {user.displayName || user.email}</p>

            {/* All songs grid */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>🎵 All Songs</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(148px,1fr))", gap: isMobile ? 10 : 14 }}>
                {ALL_SONGS.filter(t => t.audioUrl).map(t => (
                  <SongCard key={t.id} track={t} isCurrent={currentTrack?.id === t.id} isPlaying={isPlaying} onClick={() => playTrack(t, ALL_SONGS)} isMobile={isMobile} />
                ))}
              </div>
            </div>

            {/* Admin playlists sections */}
            {ALL_PLAYLISTS.map(pl => {
              const songs = adminPlaylistSongs(pl.id).filter(t => t.audioUrl);
              if (songs.length === 0) return null;
              return (
                <div key={pl.id} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📋 {pl.name}</h3>
                    <button onClick={() => { setSelectedPlaylist(pl.id); setView("playlist"); }}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>See all →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(148px,1fr))", gap: isMobile ? 10 : 14 }}>
                    {songs.slice(0, isMobile ? 4 : 6).map(t => (
                      <SongCard key={t.id} track={t} isCurrent={currentTrack?.id === t.id} isPlaying={isPlaying} onClick={() => playTrack(t, songs)} isMobile={isMobile} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIBRARY ── */}
        {view === "library" && (
          <div style={{ padding: isMobile ? "12px 16px" : "28px 32px" }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, marginTop: 0 }}>Your Library</h2>

            {/* User playlists */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>MY PLAYLISTS</div>
              </div>
              {userPlaylists.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
                  <div style={{ color: "#555", fontSize: 13, marginBottom: 4 }}>No playlists yet</div>
                  <div style={{ color: "#444", fontSize: 12 }}>Tap ⋮ on any song to add it to a playlist</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userPlaylists.map(pl => (
                    <div key={pl.id} onClick={() => { setSelectedPlaylist(pl.id); setView("userplaylist"); }}
                      style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(135deg,#e8435a,#7c1a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎵</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#efefef", fontWeight: 600, fontSize: 14 }}>{pl.name}</div>
                        <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{pl.songs?.length || 0} songs</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liked songs quick link */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
              <div style={{ color: "#888", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>SAVED</div>
              <div onClick={() => setView("liked")} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(135deg,#e8435a,#7c1a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>♥</div>
                <div>
                  <div style={{ color: "#efefef", fontWeight: 600, fontSize: 14 }}>Liked Songs</div>
                  <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{likedTracks.length} songs</div>
                </div>
              </div>
            </div>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search songs, artists, albums…"
              style={{ width: "100%", maxWidth: isMobile ? "100%" : 460, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "12px 20px", color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
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
                          <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{adminPlaylistSongs(pl.id).length} songs</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ADMIN PLAYLIST ── */}
        {view === "playlist" && selectedPlaylist && (
          <div style={{ padding: isMobile ? "12px 0" : "28px 32px" }}>
            {(() => {
              const pl = ALL_PLAYLISTS.find(p => p.id === selectedPlaylist);
              const songs = adminPlaylistSongs(selectedPlaylist);
              return (
                <>
                  <div style={{ padding: isMobile ? "0 16px 16px" : "0 0 20px" }}>
                    <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4, marginTop: 0 }}>📋 {pl?.name}</h2>
                    <div style={{ color: "#555", fontSize: 13 }}>{songs.length} songs</div>
                    {songs.length > 0 && <button onClick={() => playTrack(songs[0], songs)} style={{ marginTop: 14, background: "#e8435a", border: "none", borderRadius: 24, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "10px 22px", cursor: "pointer" }}>▶ Play All</button>}
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

        {/* ── USER PLAYLIST ── */}
        {view === "userplaylist" && selectedPlaylist && (
          <div style={{ padding: isMobile ? "12px 0" : "28px 32px" }}>
            {(() => {
              const pl = userPlaylists.find(p => p.id === selectedPlaylist);
              if (!pl) return null;
              const songs = pl.songs || [];
              return (
                <>
                  <div style={{ padding: isMobile ? "0 16px 16px" : "0 0 20px" }}>
                    <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4, marginTop: 0 }}>🎵 {pl.name}</h2>
                    <div style={{ color: "#555", fontSize: 13 }}>{songs.length} songs</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                      {songs.length > 0 && <button onClick={() => playTrack(songs[0], songs)} style={{ background: "#e8435a", border: "none", borderRadius: 24, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, padding: "10px 22px", cursor: "pointer" }}>▶ Play All</button>}
                      <button onClick={() => handleDeleteUserPlaylist(pl.id)} style={{ background: "rgba(232,67,90,0.1)", border: "1px solid rgba(232,67,90,0.2)", borderRadius: 24, color: "#e8435a", fontFamily: "inherit", fontWeight: 600, fontSize: 13, padding: "10px 18px", cursor: "pointer" }}>🗑 Delete Playlist</button>
                    </div>
                  </div>
                  {songs.length === 0
                    ? <div style={{ color: "#444", padding: isMobile ? "0 16px" : 0 }}>No songs yet. Tap ⋮ on any song to add here.</div>
                    : songs.map((t, i) => <TrackRow key={t.id} {...rowProps(t, i, songs)} />)
                  }
                </>
              );
            })()}
          </div>
        )}
      </div>

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

      {addToPlaylistTrack && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          userPlaylists={userPlaylists}
          onAdd={(plId) => handleAddToExisting(plId, addToPlaylistTrack)}
          onCreateAndAdd={handleCreateAndAdd}
          onClose={() => setAddToPlaylistTrack(null)}
        />
      )}
    </div>
  );
}
