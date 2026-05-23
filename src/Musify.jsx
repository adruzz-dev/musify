import { useState, useRef, useEffect, useCallback } from "react";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const SPOTIFY_CLIENT_SECRET = "YOUR_SPOTIFY_CLIENT_SECRET";
const LASTFM_API_KEY = "YOUR_LASTFM_API_KEY";

// Featured playlist to show on Home (Deezer playlist ID)
const FEATURED_PLAYLIST_ID = "1282516355"; // Top Hits playlist

// ─── API HELPERS ───────────────────────────────────────────────────────────────

// Deezer — no key needed, uses CORS proxy
const deezerFetch = async (path) => {
  const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://api.deezer.com${path}`)}`);
  return res.json();
};

const searchDeezer = async (query) => {
  const data = await deezerFetch(`/search?q=${encodeURIComponent(query)}&limit=20`);
  return (data.data || []).map(normalizeDeezerTrack);
};

const getDeezerPlaylist = async (id) => {
  const data = await deezerFetch(`/playlist/${id}`);
  return {
    name: data.title || "Featured",
    tracks: (data.tracks?.data || []).map(normalizeDeezerTrack),
  };
};

const getDeezerChart = async () => {
  const data = await deezerFetch(`/chart/0/tracks?limit=20`);
  return (data.data || []).map(normalizeDeezerTrack);
};

const normalizeDeezerTrack = (t) => ({
  id: `deezer-${t.id}`,
  title: t.title,
  artist: t.artist?.name || "Unknown",
  album: t.album?.title || "",
  duration: t.duration || 30,
  genre: "",
  cover: t.album?.cover_medium || t.album?.cover || "",
  src: t.preview, // 30s preview
  deezerId: t.id,
});

// Spotify — needs CLIENT_ID + CLIENT_SECRET
let spotifyToken = null;
const getSpotifyToken = async () => {
  if (spotifyToken) return spotifyToken;
  if (SPOTIFY_CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID") return null;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    spotifyToken = data.access_token;
    return spotifyToken;
  } catch { return null; }
};

const getSpotifyFeaturedPlaylists = async () => {
  const token = await getSpotifyToken();
  if (!token) return [];
  try {
    const res = await fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=6", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.playlists?.items || [];
  } catch { return []; }
};

// Last.fm — needs API key
const getArtistInfo = async (artistName) => {
  if (LASTFM_API_KEY === "YOUR_LASTFM_API_KEY") return null;
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await res.json();
    return data.artist || null;
  } catch { return null; }
};

const getSimilarArtists = async (artistName) => {
  if (LASTFM_API_KEY === "YOUR_LASTFM_API_KEY") return [];
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&limit=5&format=json`
    );
    const data = await res.json();
    return data.similarartists?.artist || [];
  } catch { return []; }
};

// ─── UTILS ─────────────────────────────────────────────────────────────────────

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function CoverArt({ cover, size = 48, title }) {
  const initials = title?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const isImage = cover && (cover.startsWith("/") || cover.startsWith("http"));
  return isImage ? (
    <img src={cover} alt={title} style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 8, background: "linear-gradient(135deg,#e8435a,#9b2335)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.28, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
      {initials}
    </div>
  );
}

const ctrlBtn = { background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18, padding: 4 };

function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a0f 80%,rgba(10,10,15,0.92) 100%)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 10, minWidth: 28, textAlign: "right" }}>{formatTime(progress)}</span>
          <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }}
            style={{ flex: 1, height: 3, background: "#2a2a2a", borderRadius: 2, cursor: "pointer" }}>
            <div style={{ width: `${(progress / (duration || 1)) * 100}%`, height: "100%", background: "#e8435a", borderRadius: 2 }} />
          </div>
          <span style={{ color: "#666", fontSize: 10, minWidth: 28 }}>{formatTime(duration)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {track && <CoverArt cover={track.cover} size={40} title={track.title} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track?.title ?? "—"}</div>
            <div style={{ color: "#888", fontSize: 11 }}>{track?.artist ?? ""}</div>
          </div>
          {track && <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#555", fontSize: 18 }}>{liked ? "♥" : "♡"}</button>}
          <button onClick={onPrev} style={ctrlBtn}>⏮</button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", border: "none", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={onNext} style={ctrlBtn}>⏭</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a0f 80%,rgba(10,10,15,0.92) 100%)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px 16px", display: "flex", alignItems: "center", gap: 24, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200, flex: 1 }}>
        {track && <CoverArt cover={track.cover} size={44} title={track.title} />}
        <div>
          <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600 }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#888", fontSize: 11 }}>{track?.artist ?? ""}</div>
        </div>
        {track && <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#555", fontSize: 16 }}>{liked ? "♥" : "♡"}</button>}
      </div>
      <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={onPrev} style={ctrlBtn}>⏮</button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", border: "none", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={onNext} style={ctrlBtn}>⏭</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <span style={{ color: "#666", fontSize: 11, minWidth: 32, textAlign: "right" }}>{formatTime(progress)}</span>
          <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }} style={{ flex: 1, height: 4, background: "#2a2a2a", borderRadius: 2, cursor: "pointer" }}>
            <div style={{ width: `${(progress / (duration || 1)) * 100}%`, height: "100%", background: "#e8435a", borderRadius: 2 }} />
          </div>
          <span style={{ color: "#666", fontSize: 11, minWidth: 32 }}>{formatTime(duration)}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
        <span style={{ color: "#666" }}>🔊</span>
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolume(parseFloat(e.target.value))} style={{ width: 80, accentColor: "#e8435a" }} />
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
        <button key={pl.id} onClick={() => { setSelectedPlaylist(pl.id); setView("playlist"); }} style={{ background: view === "playlist" && selectedPlaylist === pl.id ? "rgba(255,255,255,0.06)" : "none", border: "none", borderRadius: 8, cursor: "pointer", color: view === "playlist" && selectedPlaylist === pl.id ? "#f0f0f0" : "#777", fontFamily: "inherit", fontSize: 12, padding: "8px 14px", width: "100%", textAlign: "left" }}>
          {pl.name}
        </button>
      ))}
    </div>
  );
}

function BottomNav({ view, setView }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "search", icon: "🔍", label: "Search" },
    { id: "library", icon: "📚", label: "Library" },
    { id: "liked", icon: "♥", label: "Liked" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0d12", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", zIndex: 200, height: 56 }}>
      {items.map((item) => (
        <button key={item.id} onClick={() => setView(item.id)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: view === item.id ? "#e8435a" : "#666", fontSize: 10, fontFamily: "inherit", fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function TrackRow({ track, index, isPlaying, isCurrent, onPlay, onLike, liked, isMobile, onArtistClick }) {
  const [hover, setHover] = useState(false);
  if (isMobile) {
    return (
      <div onClick={onPlay} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.08)" : "transparent" }}>
        <div style={{ color: isCurrent ? "#e8435a" : "#666", fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>
          {isCurrent && isPlaying ? "⏸" : "▶"}
        </div>
        <CoverArt cover={track.cover} size={44} title={track.title} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isCurrent ? "#e8435a" : "#f0f0f0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
          <div onClick={(e) => { e.stopPropagation(); onArtistClick?.(track.artist); }} style={{ color: "#777", fontSize: 12, cursor: onArtistClick ? "pointer" : "default" }}>{track.artist}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "#555", fontSize: 18, padding: 4, flexShrink: 0 }}>
          {liked ? "♥" : "♡"}
        </button>
        <span style={{ color: "#666", fontSize: 12, flexShrink: 0 }}>{formatTime(track.duration)}</span>
      </div>
    );
  }
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onDoubleClick={onPlay}
      style={{ display: "grid", gridTemplateColumns: "32px 48px 1fr 80px 40px", alignItems: "center", gap: 12, padding: "6px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.08)" : hover ? "rgba(255,255,255,0.04)" : "transparent", cursor: "pointer" }}>
      <div style={{ color: isCurrent ? "#e8435a" : "#666", fontSize: 13, textAlign: "center" }}>
        {hover || isCurrent ? <span onClick={onPlay}>{isCurrent && isPlaying ? "⏸" : "▶"}</span> : index + 1}
      </div>
      <CoverArt cover={track.cover} size={40} title={track.title} />
      <div>
        <div style={{ color: isCurrent ? "#e8435a" : "#f0f0f0", fontSize: 13, fontWeight: 600 }}>{track.title}</div>
        <div onClick={(e) => { e.stopPropagation(); onArtistClick?.(track.artist); }} style={{ color: "#777", fontSize: 11, cursor: onArtistClick ? "pointer" : "default", display: "inline-block" }}
          onMouseEnter={(e) => { if (onArtistClick) e.target.style.color = "#e8435a"; }}
          onMouseLeave={(e) => { e.target.style.color = "#777"; }}>
          {track.artist}
        </div>
      </div>
      <div style={{ color: "#666", fontSize: 12 }}>{track.genre || track.album}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "transparent", fontSize: 14, padding: 0, opacity: hover || liked ? 1 : 0 }}>♥</button>
        <span style={{ color: "#666", fontSize: 12 }}>{formatTime(track.duration)}</span>
      </div>
    </div>
  );
}

// Artist Info Modal (Last.fm)
function ArtistModal({ artist, info, similar, onClose, onSearch }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a1a22", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <h2 style={{ color: "#f0f0f0", fontSize: 22, fontWeight: 800, margin: 0 }}>{artist}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {info ? (
          <>
            {info.stats && (
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "rgba(232,67,90,0.1)", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                  <div style={{ color: "#e8435a", fontWeight: 700, fontSize: 16 }}>{parseInt(info.stats.listeners).toLocaleString()}</div>
                  <div style={{ color: "#888", fontSize: 11 }}>Listeners</div>
                </div>
                <div style={{ background: "rgba(232,67,90,0.1)", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                  <div style={{ color: "#e8435a", fontWeight: 700, fontSize: 16 }}>{parseInt(info.stats.playcount).toLocaleString()}</div>
                  <div style={{ color: "#888", fontSize: 11 }}>Plays</div>
                </div>
              </div>
            )}
            {info.bio?.summary && (
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                {info.bio.summary.replace(/<[^>]+>/g, "").split("Read more")[0].trim()}
              </p>
            )}
            {info.tags?.tag?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {info.tags.tag.slice(0, 5).map((tag) => (
                  <span key={tag.name} style={{ background: "rgba(232,67,90,0.15)", color: "#e8435a", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{tag.name}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>
            {LASTFM_API_KEY === "YOUR_LASTFM_API_KEY"
              ? "Add your Last.fm API key to see artist info."
              : "Loading artist info..."}
          </div>
        )}

        {similar?.length > 0 && (
          <>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>SIMILAR ARTISTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {similar.map((a) => (
                <button key={a.name} onClick={() => { onSearch(a.name); onClose(); }}
                  style={{ background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#f0f0f0", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                  {a.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={() => { onSearch(artist); onClose(); }}
          style={{ marginTop: 16, width: "100%", background: "#e8435a", border: "none", borderRadius: 24, padding: "10px 0", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Search tracks by {artist}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function Musify() {
  const [view, setView] = useState("home");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [likedIds, setLikedIds] = useState(new Set());
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // API data
  const [featuredTracks, setFeaturedTracks] = useState([]);
  const [featuredName, setFeaturedName] = useState("Featured");
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);

  // Playlists (user's liked + spotify)
  const [playlists, setPlaylists] = useState([{ id: "liked-playlist", name: "Liked Songs", tracks: [] }]);

  // Artist modal
  const [artistModal, setArtistModal] = useState(null); // { name, info, similar }

  const audioRef = useRef(null);
  const searchTimeout = useRef(null);
  const isMobile = useIsMobile();

  // Init audio
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", handleNext);
    return () => { audio.pause(); };
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  // Load home data
  useEffect(() => {
    const loadHome = async () => {
      setLoadingHome(true);
      try {
        const playlist = await getDeezerPlaylist(FEATURED_PLAYLIST_ID);
        setFeaturedTracks(playlist.tracks);
        setFeaturedName(playlist.name);
      } catch {
        // fallback to chart
        const chart = await getDeezerChart();
        setFeaturedTracks(chart);
        setFeaturedName("Top Charts");
      }
      // Load Spotify playlists if key set
      const spLists = await getSpotifyFeaturedPlaylists();
      if (spLists.length > 0) {
        setSpotifyPlaylists(spLists);
        const converted = spLists.map((p) => ({ id: `spotify-${p.id}`, name: p.name, tracks: [] }));
        setPlaylists((prev) => [...prev, ...converted]);
      }
      setLoadingHome(false);
    };
    loadHome();
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimeout.current);
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchDeezer(search);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }, [search]);

  const handlePlay = useCallback((track) => {
    const audio = audioRef.current;
    if (!track.src) return; // no preview
    if (currentTrack?.id === track.id) {
      isPlaying ? audio.pause() : audio.play();
      setIsPlaying(!isPlaying);
    } else {
      audio.src = track.src;
      audio.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
    }
  }, [currentTrack, isPlaying]);

  const allTracks = [...featuredTracks, ...searchResults];
  const uniqueTracks = allTracks.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const list = uniqueTracks.length > 0 ? uniqueTracks : featuredTracks;
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    if (idx !== -1) handlePlay(list[(idx + 1) % list.length]);
  }, [currentTrack, uniqueTracks, featuredTracks]);

  const handlePrev = useCallback(() => {
    if (!currentTrack) return;
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const list = uniqueTracks.length > 0 ? uniqueTracks : featuredTracks;
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    if (idx !== -1) handlePlay(list[(idx - 1 + list.length) % list.length]);
  }, [currentTrack, uniqueTracks, featuredTracks]);

  const handleSeek = (ratio) => { if (audioRef.current && duration) audioRef.current.currentTime = ratio * duration; };

  const handleLike = (id) => {
    setLikedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleArtistClick = async (artistName) => {
    setArtistModal({ name: artistName, info: null, similar: [] });
    const [info, similar] = await Promise.all([getArtistInfo(artistName), getSimilarArtists(artistName)]);
    setArtistModal({ name: artistName, info, similar });
  };

  const handleSearchFromModal = (artistName) => {
    setSearch(artistName);
    setView("search");
  };

  const likedTracks = featuredTracks.filter((t) => likedIds.has(t.id));
  const mobilePadBottom = currentTrack ? 160 : 70;

  const sharedProps = {
    currentTrack, isPlaying, onPlay: handlePlay, likedIds, onLike: handleLike,
    isMobile, onArtistClick: handleArtistClick,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0f", fontFamily: "'Segoe UI',sans-serif", color: "#f0f0f0", overflow: "hidden" }}>

      {!isMobile && (
        <Sidebar view={view} setView={setView} playlists={playlists} selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist} />
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? mobilePadBottom : 100 }}>
        {isMobile && (
          <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e8435a", fontWeight: 800, fontSize: 24 }}>musify</div>
          </div>
        )}

        {/* HOME */}
        {view === "home" && (
          <div style={{ padding: isMobile ? "12px 16px" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 4 }}>Good evening 🎵</h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>Powered by Deezer • 30s previews</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#f0f0f0" }}>🎵 {featuredName}</h3>
            {loadingHome ? (
              <div style={{ color: "#555", fontSize: 13 }}>Loading tracks...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(160px,1fr))", gap: isMobile ? 12 : 16 }}>
                {featuredTracks.slice(0, 12).map((t) => (
                  <div key={t.id} onClick={() => handlePlay(t)}
                    style={{ background: "#1a1a22", borderRadius: 12, padding: isMobile ? 12 : 16, cursor: "pointer", border: `1px solid ${currentTrack?.id === t.id ? "rgba(232,67,90,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                    <CoverArt cover={t.cover} size={isMobile ? 80 : 120} title={t.title} />
                    <div style={{ color: currentTrack?.id === t.id ? "#e8435a" : "#f0f0f0", fontWeight: 700, fontSize: isMobile ? 14 : 13, marginTop: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div onClick={(e) => { e.stopPropagation(); handleArtistClick(t.artist); }} style={{ color: "#888", fontSize: isMobile ? 12 : 11, marginTop: 4, cursor: "pointer" }}>{t.artist}</div>
                    {!t.src && <div style={{ color: "#e8435a", fontSize: 10, marginTop: 4 }}>No preview</div>}
                  </div>
                ))}
              </div>
            )}

            {spotifyPlaylists.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "32px 0 16px", color: "#f0f0f0" }}>🎧 Spotify Featured Playlists</h3>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                  {spotifyPlaylists.map((p) => (
                    <div key={p.id} style={{ background: "#1a1a22", borderRadius: 12, padding: 12, minWidth: 140, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} style={{ width: "100%", borderRadius: 8, aspectRatio: "1", objectFit: "cover" }} />}
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
            {loadingHome
              ? <div style={{ color: "#555", padding: 16 }}>Loading...</div>
              : featuredTracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={likedIds.has(t.id)} onLike={() => handleLike(t.id)} />
              ))}
          </div>
        )}

        {/* LIKED */}
        {view === "liked" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>♥ Liked Songs</h2>
            {likedTracks.length === 0
              ? <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>No liked songs yet. Tap ♡ on any song!</div>
              : likedTracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={true} onLike={() => handleLike(t.id)} />
              ))}
          </div>
        )}

        {/* SEARCH */}
        {view === "search" && (
          <div style={{ padding: isMobile ? "12px 16px" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 16 }}>Search</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs, artists... (Deezer)"
              style={{ width: "100%", maxWidth: isMobile ? "100%" : 480, background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "12px 20px", color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ marginTop: 20 }}>
              {searching && <div style={{ color: "#555", fontSize: 13 }}>Searching Deezer...</div>}
              {!searching && search && searchResults.length === 0 && <div style={{ color: "#555" }}>No results found.</div>}
              {searchResults.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={likedIds.has(t.id)} onLike={() => handleLike(t.id)} />
              ))}
            </div>
          </div>
        )}

        {/* PLAYLIST */}
        {view === "playlist" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>
              🎵 {playlists.find((p) => p.id === selectedPlaylist)?.name || "Playlist"}
            </h2>
            {selectedPlaylist === "liked-playlist"
              ? likedTracks.length === 0
                ? <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>No liked songs yet!</div>
                : likedTracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={true} onLike={() => handleLike(t.id)} />)
              : <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>Connect Spotify to load this playlist.</div>}
          </div>
        )}
      </div>

      <PlayerBar
        track={currentTrack} isPlaying={isPlaying}
        onToggle={() => { if (!currentTrack) return; isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); }}
        progress={progress} duration={duration} onSeek={handleSeek} onNext={handleNext} onPrev={handlePrev}
        volume={volume} onVolume={setVolume}
        liked={currentTrack ? likedIds.has(currentTrack.id) : false}
        onLike={() => currentTrack && handleLike(currentTrack.id)}
        isMobile={isMobile}
      />

      {isMobile && <BottomNav view={view} setView={setView} />}

      {artistModal && (
        <ArtistModal
          artist={artistModal.name}
          info={artistModal.info}
          similar={artistModal.similar}
          onClose={() => setArtistModal(null)}
          onSearch={handleSearchFromModal}
        />
      )}
    </div>
  );
}