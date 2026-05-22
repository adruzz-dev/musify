import { useState, useRef, useEffect } from "react";

const TRACKS = [
  {
    id: 1,
    title: "KALYANI",
    artist: "ARJN & KDS",
    album: "album",
    duration: 234,
    genre: "molywood",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779449356/artworks-X7VgPpOQzk6r1htx-1zjCOA-t500x500_fhil3r.jpg",
    src: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779447548/KALYANI_vcsmqg.mp3",
  },
];

const PLAYLISTS = [{ id: 1, name: "My Favourites", tracks: [1, 2] }];

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

function CoverArt({ cover, size = 48, title }) {
  const initials = title.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const isImage = cover && (cover.startsWith("/") || cover.startsWith("http"));
  return isImage ? (
    <img src={cover} alt={title} style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 8, background: `linear-gradient(135deg, ${cover} 0%, ${cover}88 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", fontSize: size * 0.28, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
      {initials}
    </div>
  );
}

const ctrlBtn = { background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18, padding: 4 };

function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "linear-gradient(0deg, #0a0a0f 80%, rgba(10,10,15,0.92) 100%)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", zIndex: 100 }}>
        {/* Seek bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 10, minWidth: 28, textAlign: "right" }}>{formatTime(progress)}</span>
          <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }}
            style={{ flex: 1, height: 3, background: "#2a2a2a", borderRadius: 2, cursor: "pointer" }}>
            <div style={{ width: `${(progress / (duration || 1)) * 100}%`, height: "100%", background: "#e8435a", borderRadius: 2 }} />
          </div>
          <span style={{ color: "#666", fontSize: 10, minWidth: 28 }}>{formatTime(duration)}</span>
        </div>
        {/* Track info + controls */}
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
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, #0a0a0f 80%, rgba(10,10,15,0.92) 100%)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px 16px", display: "flex", alignItems: "center", gap: 24, zIndex: 100 }}>
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

// Bottom nav for mobile
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

function TrackRow({ track, index, isPlaying, isCurrent, onPlay, onLike, liked, isMobile }) {
  const [hover, setHover] = useState(false);
  if (isMobile) {
    return (
      <div onClick={onPlay}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 8, background: isCurrent ? "rgba(232,67,90,0.08)" : "transparent" }}>
        <div style={{ color: isCurrent ? "#e8435a" : "#666", fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>
          {isCurrent && isPlaying ? "⏸" : "▶"}
        </div>
        <CoverArt cover={track.cover} size={44} title={track.title} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isCurrent ? "#e8435a" : "#f0f0f0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
          <div style={{ color: "#777", fontSize: 12 }}>{track.artist}</div>
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
        <div style={{ color: "#777", fontSize: 11 }}>{track.artist}</div>
      </div>
      <div style={{ color: "#666", fontSize: 12 }}>{track.genre}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e8435a" : "transparent", fontSize: 14, padding: 0, opacity: hover || liked ? 1 : 0 }}>♥</button>
        <span style={{ color: "#666", fontSize: 12 }}>{formatTime(track.duration)}</span>
      </div>
    </div>
  );
}

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
  const audioRef = useRef(null);
  const isMobile = useIsMobile();

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

  const handlePlay = (track) => {
    const audio = audioRef.current;
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
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const idx = TRACKS.findIndex((t) => t.id === currentTrack.id);
    handlePlay(TRACKS[(idx + 1) % TRACKS.length]);
  };

  const handlePrev = () => {
    if (!currentTrack) return;
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const idx = TRACKS.findIndex((t) => t.id === currentTrack.id);
    handlePlay(TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length]);
  };

  const handleSeek = (ratio) => { if (audioRef.current && duration) audioRef.current.currentTime = ratio * duration; };

  const handleLike = (id) => {
    setLikedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const activePlaylist = PLAYLISTS.find((p) => p.id === selectedPlaylist);
  const searchResults = search.trim() ? TRACKS.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase())) : [];
  const sharedProps = { currentTrack, isPlaying, onPlay: handlePlay, likedIds, onLike: handleLike, isMobile };

  // Mobile bottom padding: player bar (≈90px) + bottom nav (56px)
  const mobilePadBottom = currentTrack ? 160 : 70;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0f", fontFamily: "'Segoe UI',sans-serif", color: "#f0f0f0", overflow: "hidden" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar view={view} setView={setView} playlists={PLAYLISTS} selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? mobilePadBottom : 100 }}>

        {/* Mobile header */}
        {isMobile && (
          <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e8435a", fontWeight: 800, fontSize: 24 }}>musify</div>
          </div>
        )}

        {view === "home" && (
          <div style={{ padding: isMobile ? "12px 16px" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20 }}>Good evening 🎵</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill,minmax(160px,1fr))", gap: isMobile ? 12 : 16 }}>
              {TRACKS.map((t) => (
                <div key={t.id} onClick={() => handlePlay(t)} style={{ background: "#1a1a22", borderRadius: 12, padding: isMobile ? 12 : 16, cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <CoverArt cover={t.cover} size={isMobile ? 80 : 56} title={t.title} />
                  <div style={{ color: "#f0f0f0", fontWeight: 700, fontSize: isMobile ? 14 : 13, marginTop: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                  <div style={{ color: "#888", fontSize: isMobile ? 12 : 11, marginTop: 4 }}>{t.artist}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "library" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>Your Library</h2>
            {TRACKS.map((t, i) => <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={likedIds.has(t.id)} onLike={() => handleLike(t.id)} />)}
          </div>
        )}

        {view === "liked" && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>♥ Liked Songs</h2>
            {TRACKS.filter((t) => likedIds.has(t.id)).length === 0
              ? <div style={{ color: "#555", padding: isMobile ? "0 16px" : 0 }}>No liked songs yet. Tap ♡ on any song!</div>
              : TRACKS.filter((t) => likedIds.has(t.id)).map((t, i) => <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={true} onLike={() => handleLike(t.id)} />)}
          </div>
        )}

        {view === "search" && (
          <div style={{ padding: isMobile ? "12px 16px" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 16 }}>Search</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs or artists..."
              style={{ width: "100%", maxWidth: isMobile ? "100%" : 480, background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "12px 20px", color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ marginTop: 20 }}>
              {search && searchResults.length === 0
                ? <div style={{ color: "#555" }}>No results found.</div>
                : searchResults.map((t, i) => <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={likedIds.has(t.id)} onLike={() => handleLike(t.id)} />)}
            </div>
          </div>
        )}

        {view === "playlist" && activePlaylist && (
          <div style={{ padding: isMobile ? "12px 0" : 32 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20, padding: isMobile ? "0 16px" : 0 }}>🎵 {activePlaylist.name}</h2>
            {activePlaylist.tracks.map((id, i) => {
              const t = TRACKS.find((tr) => tr.id === id);
              return t ? <TrackRow key={t.id} track={t} index={i} {...sharedProps} isCurrent={currentTrack?.id === t.id} onPlay={() => handlePlay(t)} liked={likedIds.has(t.id)} onLike={() => handleLike(t.id)} /> : null;
            })}
          </div>
        )}

      </div>

      {/* Player bar */}
      <PlayerBar
        track={currentTrack} isPlaying={isPlaying}
        onToggle={() => { if (!currentTrack) return; isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); }}
        progress={progress} duration={duration} onSeek={handleSeek} onNext={handleNext} onPrev={handlePrev}
        volume={volume} onVolume={setVolume}
        liked={currentTrack ? likedIds.has(currentTrack.id) : false}
        onLike={() => currentTrack && handleLike(currentTrack.id)}
        isMobile={isMobile}
      />

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav view={view} setView={setView} />}

    </div>
  );
}