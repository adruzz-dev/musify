import AdminPanel from "./AdminPanel";
import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, sendEmailVerification,
  onAuthStateChanged, signOut,
  updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential,
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL,
} from "firebase/storage";

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
  measurementId: "G-VLPDWD4CTL",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// ─────────────────────────────────────────────────────────────────────────────
// SONGS
// ─────────────────────────────────────────────────────────────────────────────
const SONGS = [
  {
    id: "1",
    title: "Vaishakha Sandhye",
    artist: "KJ Yesudas",
    album: "Nadodikkattu",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779531012/Vaisakha_Sandhye_HD_Video_Song_Mohanlal_Shobana_-_Nadodikkattu_-_Saina_Music_youtube_u2fvmk.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779530849/images_p3p8bd.jpg",
  },
  {
    id: "2",
    title: "Jeevamshamayi",
    artist: "K S Harishankar & Shreya Ghoshal",
    album: "Theevandi",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779556908/Theevandi___Jeevamshamayi___Video_Song___August_Cinema___Kailas_Menon___Shreya_Ghoshal___Harisankar_DInfmi-YIiw_hogqum.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557549/images_wy9ybz.jpg",
  },
  {
    id: "3",
    title: "Aaradhikee",
    artist: "Madhuvanthi Narayan, Sooraj Santhosh",
    album: "Aaradhike",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557126/Aaradhike_Video_Song___Soubin_Shahir___E4_Entertainment___Johnpaul_George_dAezp422I_A_enjry4.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779561178/images_2_fuqfh9.jpg",
  },
  {
    id: "4",
    title: "Malare",
    artist: "Rajesh Murugesan, Vijay Yesudas",
    album: "Premam",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557149/Premam_Malare_Video_Song_Rajesh_Murugesan_Vijay_Yesudas_Nivin_Pauly_Sai_Pallavi_-_Anwar_Rasheed_Entertainment_Official_youtube_iplxn3.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557550/images_4_opydxc.jpg",
  },
  {
    id: "5",
    title: "Uyiril Thodum",
    artist: "Sushin Shyam, Sooraj Santhosh, Anne Amie",
    album: "Kumbalangi Nights",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557117/%E0%B4%89%E0%B4%AF%E0%B4%BF%E0%B4%B0%E0%B4%BF%E0%B5%BD_%E0%B4%A4%E0%B5%8A%E0%B4%9F%E0%B5%81%E0%B4%82_Uyiril_Thodum_-_Kumbalangi_Nights_Official_Video_Song___Sooraj_Santhosh___Anne_Amie_ZKhOs_Pc_7s_tyqluu.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557550/images_3_pwgkgc.jpg",
  },
  {
    id: "6",
    title: "Darshana",
    artist: "Vineeth Sreenivasan",
    album: "Hridayam",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557122/Darshana_-_Official_Video_Song___Hridayam___Pranav___Darshana___Vineeth___Hesham___Merryland_epAFDEJImrU_hsyy47.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557549/ab67616d00001e029b8c8ab6e0a59493a5fa06c6_pi7ztc.jpg",
  },
  {
    id: "7",
    title: "Pavizha Mazha",
    artist: "K. S. Harisankar",
    album: "Athiran",
    audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557116/Pavizha_Mazha___Athiran___Video___Fahad_Faasil___Sai_Pallavi___Vivek___K_S_Harisankar___P_S_Jayhari_P-jKtzUuVcM_z8j9j6.mp3",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557550/images_1_qkeze0.jpg",
  },
].filter((s) => s.id && s.title && s.audioUrl);

const PLAYLISTS = [
  {
    id: "pl-1",
    name: "Malayalam Melodies",
    cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779449356/artworks-X7VgPpOQzk6r1htx-1zjCOA-t500x500_fhil3r.jpg",
    songIds: ["1", "2", "3", "4", "5", "6", "7"],
  },
];

function resolvePlaylists() {
  return PLAYLISTS.map((pl) => ({
    ...pl,
    songs: pl.songIds.map((sid) => SONGS.find((s) => s.id === sid)).filter(Boolean),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getUserDoc = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};
const createUserDoc = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    name: data.name || "",
    email: data.email || "",
    avatarUrl: "",
    playlists: [],
    likedSongs: [],
    listeningStats: { totalPlays: 0, totalMinutes: 0, topArtist: "" },
    createdAt: Date.now(),
  });
};
const saveUserLiked = async (uid, likedSongs) =>
  updateDoc(doc(db, "users", uid), { likedSongs });
const saveUserPlaylist = async (uid, playlist) =>
  updateDoc(doc(db, "users", uid), { playlists: arrayUnion(playlist) });
const deleteUserPlaylist = async (uid, playlist) =>
  updateDoc(doc(db, "users", uid), { playlists: arrayRemove(playlist) });

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
function useAudioPlayer(onEnded, onPlayStateChange, playbackSettings) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const eqBandsRef = useRef([]);
  const sleepTimerRef = useRef(null);
  const unlockedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const settingsRef = useRef(playbackSettings);
  useEffect(() => { settingsRef.current = playbackSettings; }, [playbackSettings]);

  useEffect(() => {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.volume = volume;
    audioRef.current = a;
    a.addEventListener("ended", () => onEnded?.());
    a.addEventListener("play", () => onPlayStateChange?.(true));
    a.addEventListener("pause", () => onPlayStateChange?.(false));
    a.addEventListener("timeupdate", () => {
      setProgress(a.currentTime);
      const s = settingsRef.current;
      if (s?.crossfade > 0 && a.duration && !isNaN(a.duration)) {
        const remaining = a.duration - a.currentTime;
        if (remaining <= s.crossfade && remaining > 0) {
          const fade = remaining / s.crossfade;
          if (gainRef.current) gainRef.current.gain.value = Math.max(0, fade) * a.volume;
        }
      }
    });
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    };
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });
    return () => {
      a.pause();
      clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const setupWebAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaElementSource(audioRef.current);
      const gain = ctx.createGain();
      gainRef.current = gain;
      gain.gain.value = volume;
      const bands = [60, 250, 1000, 4000, 12000].map((freq) => {
        const f = ctx.createBiquadFilter();
        f.type = "peaking";
        f.frequency.value = freq;
        f.Q.value = 1;
        f.gain.value = 0;
        return f;
      });
      eqBandsRef.current = bands;
      let prev = src;
      bands.forEach((b) => { prev.connect(b); prev = b; });
      prev.connect(gain);
      gain.connect(ctx.destination);
    } catch (e) { console.warn("WebAudio setup failed:", e); }
  }, []);

  const applyEQ = useCallback((gains) => {
    eqBandsRef.current.forEach((b, i) => { if (gains[i] !== undefined) b.gain.value = gains[i]; });
  }, []);

  const load = useCallback((url) => {
    const a = audioRef.current;
    if (!a) return Promise.resolve();
    if (gainRef.current) gainRef.current.gain.value = a.volume;
    a.src = url;
    a.load();
    return a.play().then(() => { if (!audioCtxRef.current) setupWebAudio(); }).catch((err) => console.warn("Audio play failed:", err));
  }, [setupWebAudio]);

  const setSleepTimer = useCallback((minutes) => {
    clearTimeout(sleepTimerRef.current);
    if (minutes > 0) sleepTimerRef.current = setTimeout(() => audioRef.current?.pause(), minutes * 60 * 1000);
  }, []);

  return {
    progress, duration,
    volume: Math.round(volume * 100),
    load,
    play: () => { const a = audioRef.current; if (!a) return; if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume(); a.play().catch(() => {}); },
    pause: () => audioRef.current?.pause(),
    seek: (r) => { const a = audioRef.current; if (!a) return; const d = a.duration; if (d && isFinite(d) && d > 0) a.currentTime = r * d; },
    setVol: (v) => { const val = v / 100; setVolume(val); if (audioRef.current) audioRef.current.volume = val; if (gainRef.current) gainRef.current.gain.value = val; },
    applyEQ, setSleepTimer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER ART
// ─────────────────────────────────────────────────────────────────────────────
function CoverArt({ cover, size = 48, title, radius = 6 }) {
  const initials = title?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "♪";
  const sz = typeof size === "number" ? size : "100%";
  return cover ? (
    <img src={cover} alt={title} style={{ width: sz, height: sz, borderRadius: radius, objectFit: "cover", flexShrink: 0, display: "block" }} />
  ) : (
    <div style={{ width: sz, height: sz, borderRadius: radius, flexShrink: 0, background: "linear-gradient(135deg,#e8435a 0%,#7c1a2a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: typeof size === "number" ? Math.max(10, size * 0.28) : 14, fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON COMPONENTS (SVG inline, no deps)
// ─────────────────────────────────────────────────────────────────────────────
const Ico = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
  Library: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>,
  Heart: ({ filled }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#e8435a" : "none"} stroke={filled ? "#e8435a" : "currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Play: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Pause: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Prev: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="2" height="16"/></svg>,
  Next: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16"/></svg>,
  Shuffle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>,
  Repeat: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
  RepeatOne: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>,
  Volume: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
  Dots: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>,
  Google: () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (CSS-in-JS via style tag)
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Circular+Std:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; background: #0a0a0f; color: #e8e8e8; font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    button { font-family: inherit; }
    .sidebar-item { display:flex; align-items:center; gap:12px; padding:8px 12px; border-radius:6px; cursor:pointer; color:#aaa; font-size:14px; font-weight:500; transition:all .15s; background:none; border:none; width:100%; text-align:left; }
    .sidebar-item:hover { color:#fff; background:rgba(255,255,255,0.06); }
    .sidebar-item.active { color:#fff; background:rgba(232,67,90,0.12); }
    .song-row { display:grid; grid-template-columns:32px 1fr 1fr 60px; align-items:center; gap:12px; padding:8px 16px; border-radius:6px; cursor:pointer; transition:background .12s; }
    .song-row:hover { background:rgba(255,255,255,0.06); }
    .song-row.active { background:rgba(232,67,90,0.08); }
    .song-row .num { color:#888; font-size:13px; text-align:center; }
    .song-row.active .num { color:#e8435a; }
    .icon-btn { background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:6px; border-radius:50%; color:#888; transition:all .15s; }
    .icon-btn:hover { color:#fff; background:rgba(255,255,255,0.08); }
    .icon-btn.active { color:#e8435a; }
    .progress-bar { flex:1; height:4px; background:rgba(255,255,255,0.12); border-radius:2px; cursor:pointer; position:relative; }
    .progress-bar:hover .progress-thumb { opacity:1; }
    .progress-fill { height:100%; background:#e8435a; border-radius:2px; transition:width .2s linear; pointer-events:none; }
    .progress-thumb { position:absolute; top:50%; right:-5px; transform:translateY(-50%); width:10px; height:10px; background:#fff; border-radius:50%; opacity:0; transition:opacity .15s; pointer-events:none; }
    .volume-bar { width:80px; height:4px; background:rgba(255,255,255,0.12); border-radius:2px; cursor:pointer; }
    .card { background:#111118; border-radius:10px; padding:14px; cursor:pointer; transition:background .15s; }
    .card:hover { background:#1a1a24; }
    .input-field { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:10px 14px; color:#e8e8e8; font-size:14px; font-family:inherit; outline:none; width:100%; transition:border .15s; }
    .input-field:focus { border-color:#e8435a; }
    .btn-primary { background:#e8435a; color:#fff; border:none; border-radius:500px; padding:10px 28px; font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; letter-spacing:.5px; }
    .btn-primary:hover { background:#ff5570; transform:scale(1.02); }
    .btn-outline { background:transparent; color:#e8e8e8; border:1px solid rgba(255,255,255,0.2); border-radius:500px; padding:10px 28px; font-size:14px; font-weight:600; cursor:pointer; transition:all .15s; }
    .btn-outline:hover { border-color:#fff; color:#fff; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .fade-in { animation: fadeIn .25s ease; }
    @media (max-width: 768px) { .song-row { grid-template-columns:28px 1fr 50px; } .song-row .album-col { display:none; } }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// SEEK BAR
// ─────────────────────────────────────────────────────────────────────────────
function SeekBar({ progress, duration, onSeek, style = {} }) {
  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = progress && isFinite(progress) ? progress : 0;
  const pct = safeDuration > 0 ? (safeProgress / safeDuration) * 100 : 0;
  return (
    <div className="progress-bar" style={style}
      onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <div className="progress-thumb" style={{ left: `${pct}%`, right: "unset" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER BAR — Spotify-style bottom bar
// ─────────────────────────────────────────────────────────────────────────────
function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile, shuffle, repeat, onShuffleToggle, onRepeatToggle }) {
  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = progress && isFinite(progress) ? progress : 0;

  if (isMobile) {
    return (
      <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "#111118", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", zIndex: 200 }}>
        <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CoverArt cover={track?.cover} size={40} title={track?.title} radius={4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.title ?? "—"}</div>
            <div style={{ color: "#888", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.artist ?? ""}</div>
          </div>
          <button className={`icon-btn${liked ? " active" : ""}`} onClick={onLike}><Ico.Heart filled={liked} /></button>
          <button className="icon-btn" onClick={onPrev} style={{ color: "#aaa" }}><Ico.Prev /></button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8435a", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
          <button className="icon-btn" onClick={onNext} style={{ color: "#aaa" }}><Ico.Next /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 90, background: "#0d0d14", borderTop: "1px solid rgba(255,255,255,0.07)", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", alignItems: "center", padding: "0 24px", gap: 16, zIndex: 200 }}>
      {/* Left — track info */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <CoverArt cover={track?.cover} size={52} title={track?.title} radius={4} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#888", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.artist ?? ""}</div>
        </div>
        <button className={`icon-btn${liked ? " active" : ""}`} onClick={onLike} style={{ marginLeft: 4, flexShrink: 0 }}><Ico.Heart filled={liked} /></button>
      </div>
      {/* Center — controls + seek */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button className={`icon-btn${shuffle ? " active" : ""}`} onClick={onShuffleToggle}><Ico.Shuffle /></button>
          <button className="icon-btn" onClick={onPrev} style={{ color: "#aaa" }}><Ico.Prev /></button>
          <button onClick={onToggle} style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", color: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform .1s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
          <button className="icon-btn" onClick={onNext} style={{ color: "#aaa" }}><Ico.Next /></button>
          <button className={`icon-btn${repeat !== "off" ? " active" : ""}`} onClick={onRepeatToggle}>
            {repeat === "one" ? <Ico.RepeatOne /> : <Ico.Repeat />}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ color: "#888", fontSize: 11, minWidth: 32, textAlign: "right" }}>{formatTime(safeProgress)}</span>
          <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ flex: 1 }} />
          <span style={{ color: "#888", fontSize: 11, minWidth: 32 }}>{formatTime(safeDuration)}</span>
        </div>
      </div>
      {/* Right — volume */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
        <button className="icon-btn"><Ico.Volume /></button>
        <div className="volume-bar"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onVolume(Math.round(((e.clientX - r.left) / r.width) * 100)); }}>
          <div style={{ height: "100%", width: `${volume}%`, background: "#e8435a", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SONG ROW
// ─────────────────────────────────────────────────────────────────────────────
function SongRow({ song, index, isActive, isPlaying, onPlay, liked, onLike }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={`song-row${isActive ? " active" : ""}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onDoubleClick={onPlay}>
      <div className="num">
        {hovered || isActive ? (
          <button onClick={onPlay} style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? "#e8435a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            {isActive && isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
        ) : <span>{index + 1}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <CoverArt cover={song.cover} size={40} title={song.title} radius={4} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#e8435a" : "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
          <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
        </div>
      </div>
      <div className="album-col" style={{ fontSize: 13, color: "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.album}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
        <button className={`icon-btn${liked ? " active" : ""}`} onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ opacity: hovered || liked ? 1 : 0, transition: "opacity .15s" }}>
          <Ico.Heart filled={liked} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, user, userPlaylists, onCreatePlaylist, onSelectPlaylist }) {
  return (
    <div style={{ width: 240, background: "#0a0a0f", display: "flex", flexDirection: "column", gap: 2, padding: "16px 8px", overflowY: "auto", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Logo */}
      <div style={{ padding: "8px 12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8435a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>♪</div>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>Musify</span>
      </div>

      <button className={`sidebar-item${view === "home" ? " active" : ""}`} onClick={() => setView("home")}><Ico.Home /><span>Home</span></button>
      <button className={`sidebar-item${view === "search" ? " active" : ""}`} onClick={() => setView("search")}><Ico.Search /><span>Search</span></button>
      <button className={`sidebar-item${view === "library" ? " active" : ""}`} onClick={() => setView("library")}><Ico.Library /><span>Your Library</span></button>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 4px" }} />

      <div style={{ padding: "4px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".8px" }}>Playlists</span>
        {user && <button className="icon-btn" onClick={onCreatePlaylist} title="New playlist"><Ico.Plus /></button>}
      </div>

      {/* Built-in playlists */}
      {resolvePlaylists().map((pl) => (
        <button key={pl.id} className="sidebar-item" onClick={() => onSelectPlaylist(pl)}>
          <CoverArt cover={pl.cover} size={30} title={pl.name} radius={3} />
          <span style={{ fontSize: 13 }}>{pl.name}</span>
        </button>
      ))}

      {/* Liked songs */}
      {user && (
        <button className={`sidebar-item${view === "liked" ? " active" : ""}`} onClick={() => setView("liked")}>
          <div style={{ width: 30, height: 30, borderRadius: 3, background: "linear-gradient(135deg,#7c1a2a,#e8435a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ico.Heart filled />
          </div>
          <span style={{ fontSize: 13 }}>Liked Songs</span>
        </button>
      )}

      {/* User playlists */}
      {userPlaylists?.map((pl) => (
        <button key={pl.id} className="sidebar-item" onClick={() => onSelectPlaylist(pl)}>
          <div style={{ width: 30, height: 30, borderRadius: 3, background: "#1a1a24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>♪</div>
          <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME VIEW
// ─────────────────────────────────────────────────────────────────────────────
function HomeView({ user, onSelectPlaylist, currentTrack, onPlay, isPlaying, likedSongs, onLike }) {
  const playlists = resolvePlaylists();
  return (
    <div className="fade-in" style={{ padding: "32px 32px 120px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28, color: "#fff" }}>{getGreeting()}{user ? `, ${user.displayName?.split(" ")[0] || ""}` : ""}!</h1>

      {/* Featured playlists grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
        {playlists.map((pl) => (
          <div key={pl.id} className="card" onClick={() => onSelectPlaylist(pl)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CoverArt cover={pl.cover} size="100%" title={pl.name} radius={6} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{pl.name}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{pl.songs?.length} songs</div>
            </div>
          </div>
        ))}
      </div>

      {/* All songs section */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>All Songs</h2>
      <div style={{ background: "#0f0f16", borderRadius: 10, overflow: "hidden" }}>
        <div className="song-row" style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "default" }}>
          <div style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: ".8px" }}>#</div>
          <div style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: ".8px" }}>Title</div>
          <div className="album-col" style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: ".8px" }}>Album</div>
          <div />
        </div>
        {SONGS.map((song, i) => (
          <SongRow key={song.id} song={song} index={i}
            isActive={currentTrack?.id === song.id} isPlaying={isPlaying}
            onPlay={() => onPlay(song, SONGS, i)}
            liked={likedSongs.includes(song.id)}
            onLike={() => onLike(song.id)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH VIEW
// ─────────────────────────────────────────────────────────────────────────────
function SearchView({ currentTrack, isPlaying, onPlay, likedSongs, onLike }) {
  const [q, setQ] = useState("");
  const results = q.trim()
    ? SONGS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.artist.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div className="fade-in" style={{ padding: "32px 32px 120px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Search</h1>
      <div style={{ position: "relative", maxWidth: 480, marginBottom: 28 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#888" }}><Ico.Search /></span>
        <input className="input-field" placeholder="What do you want to listen to?" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 44, borderRadius: 500 }} />
      </div>

      {q ? (
        results.length > 0 ? (
          <div style={{ background: "#0f0f16", borderRadius: 10 }}>
            {results.map((song, i) => (
              <SongRow key={song.id} song={song} index={i}
                isActive={currentTrack?.id === song.id} isPlaying={isPlaying}
                onPlay={() => onPlay(song, results, i)}
                liked={likedSongs.includes(song.id)}
                onLike={() => onLike(song.id)} />
            ))}
          </div>
        ) : (
          <div style={{ color: "#888", textAlign: "center", marginTop: 60, fontSize: 15 }}>No results found for "<strong style={{ color: "#ccc" }}>{q}</strong>"</div>
        )
      ) : (
        <div>
          <p style={{ color: "#888", fontSize: 14 }}>Search across {SONGS.length} songs</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYLIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function PlaylistView({ playlist, currentTrack, isPlaying, onPlay, likedSongs, onLike }) {
  const songs = playlist.songs || [];
  return (
    <div className="fade-in" style={{ paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: "48px 32px 32px", background: "linear-gradient(180deg,rgba(232,67,90,0.25) 0%,transparent 100%)", display: "flex", alignItems: "flex-end", gap: 28 }}>
        <CoverArt cover={playlist.cover} size={180} title={playlist.name} radius={6} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ccc", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Playlist</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>{playlist.name}</h1>
          <div style={{ fontSize: 13, color: "#aaa" }}>{songs.length} songs</div>
        </div>
      </div>
      {/* Song list */}
      <div style={{ padding: "0 16px" }}>
        <div className="song-row" style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "default", marginBottom: 4 }}>
          <div style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: ".8px" }}>#</div>
          <div style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: ".8px" }}>Title</div>
          <div className="album-col" style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: ".8px" }}>Album</div>
          <div />
        </div>
        {songs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i}
            isActive={currentTrack?.id === song.id} isPlaying={isPlaying}
            onPlay={() => onPlay(song, songs, i)}
            liked={likedSongs.includes(song.id)}
            onLike={() => onLike(song.id)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIKED VIEW
// ─────────────────────────────────────────────────────────────────────────────
function LikedView({ likedSongs, currentTrack, isPlaying, onPlay, onLike }) {
  const songs = SONGS.filter((s) => likedSongs.includes(s.id));
  return (
    <div className="fade-in" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "48px 32px 32px", background: "linear-gradient(180deg,rgba(232,67,90,0.3) 0%,transparent 100%)", display: "flex", alignItems: "flex-end", gap: 28 }}>
        <div style={{ width: 180, height: 180, borderRadius: 6, background: "linear-gradient(135deg,#7c1a2a,#e8435a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>♥</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ccc", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Playlist</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>Liked Songs</h1>
          <div style={{ fontSize: 13, color: "#aaa" }}>{songs.length} songs</div>
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        {songs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", padding: "60px 0", fontSize: 14 }}>Songs you like will appear here.</div>
        ) : songs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i}
            isActive={currentTrack?.id === song.id} isPlaying={isPlaying}
            onPlay={() => onPlay(song, songs, i)}
            liked onLike={() => onLike(song.id)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH VIEW
// ─────────────────────────────────────────────────────────────────────────────
function AuthView({ onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""), [pass, setPass] = useState(""), [name, setName] = useState("");
  const [err, setErr] = useState(""), [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
        await createUserDoc(cred.user.uid, { name, email });
        await sendEmailVerification(cred.user);
      }
      onClose();
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const exists = await getUserDoc(cred.user.uid);
      if (!exists) await createUserDoc(cred.user.uid, { name: cred.user.displayName, email: cred.user.email });
      onClose();
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }}>
      <div style={{ background: "#111118", borderRadius: 14, padding: "36px 32px", width: "100%", maxWidth: 400, position: "relative" }}>
        <button className="icon-btn" onClick={onClose} style={{ position: "absolute", top: 16, right: 16 }}><Ico.X /></button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>♪</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{mode === "login" ? "Log in to Musify" : "Sign up for Musify"}</h2>
        </div>

        <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 500, padding: "10px 0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 20, fontFamily: "inherit" }}>
          <Ico.Google /> Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ color: "#888", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className="input-field" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-field" placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          {err && <div style={{ color: "#e8435a", fontSize: 12, padding: "8px 12px", background: "rgba(232,67,90,0.1)", borderRadius: 6 }}>{err}</div>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? "..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#e8435a", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
function MobileNav({ view, setView }) {
  const items = [
    { id: "home", label: "Home", Icon: Ico.Home },
    { id: "search", label: "Search", Icon: Ico.Search },
    { id: "library", label: "Library", Icon: Ico.Library },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 56, background: "#0d0d14", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", zIndex: 300 }}>
      {items.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => setView(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: view === id ? "#e8435a" : "#888", fontSize: 10, fontWeight: 600, fontFamily: "inherit", transition: "color .15s" }}>
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR (desktop)
// ─────────────────────────────────────────────────────────────────────────────
function TopBar({ user, onShowAuth, onSignOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ height: 60, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 32px", gap: 12, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)", position: "sticky", top: 0, zIndex: 100 }}>
      {user ? (
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 500, padding: "6px 12px 6px 6px", cursor: "pointer", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8435a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              {user.displayName?.[0]?.toUpperCase() || <Ico.User />}
            </div>
            {user.displayName?.split(" ")[0] || "Profile"}
          </button>
          {open && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#1a1a24", borderRadius: 8, padding: 8, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 200 }}>
              <button onClick={() => { onSignOut(); setOpen(false); }} style={{ width: "100%", background: "none", border: "none", color: "#e8e8e8", padding: "8px 12px", borderRadius: 4, cursor: "pointer", fontSize: 14, textAlign: "left", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                Log out
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-outline" onClick={onShowAuth} style={{ padding: "7px 20px", fontSize: 13 }}>Log in</button>
          <button className="btn-primary" onClick={onShowAuth} style={{ padding: "7px 20px", fontSize: 13 }}>Sign up</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function LibraryView({ user, userPlaylists, onSelectPlaylist, onShowAuth }) {
  const playlists = resolvePlaylists();
  return (
    <div className="fade-in" style={{ padding: "32px 32px 120px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 24 }}>Your Library</h1>
      {!user && (
        <div style={{ background: "#111118", borderRadius: 10, padding: "24px", marginBottom: 24, textAlign: "center" }}>
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 14 }}>Log in to see your library and liked songs</p>
          <button className="btn-primary" onClick={onShowAuth}>Log in</button>
        </div>
      )}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 12 }}>Playlists</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
        {playlists.map((pl) => (
          <div key={pl.id} className="card" onClick={() => onSelectPlaylist(pl)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <CoverArt cover={pl.cover} size="100%" title={pl.name} radius={6} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{pl.name}</div>
          </div>
        ))}
        {userPlaylists?.map((pl) => (
          <div key={pl.id} className="card" onClick={() => onSelectPlaylist(pl)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ width: "100%", paddingTop: "100%", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#1a1a24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>♪</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{pl.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [playbackSettings] = useState({ crossfade: 0 });

  const likedSongs = userData?.likedSongs || [];
  const userPlaylists = userData?.playlists || [];

  const handleEnded = useCallback(() => {
    if (repeat === "one") { player.seek(0); player.play(); return; }
    const next = queueIdx + 1;
    if (next < queue.length) { setQueueIdx(next); setCurrentTrack(queue[next]); }
    else if (repeat === "all") { setQueueIdx(0); setCurrentTrack(queue[0]); }
    else setIsPlaying(false);
  }, [repeat, queueIdx, queue]);

  const player = useAudioPlayer(handleEnded, setIsPlaying, playbackSettings);

  useEffect(() => {
    if (currentTrack) player.load(currentTrack.audioUrl);
  }, [currentTrack]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) { const d = await getUserDoc(u.uid); setUserData(d); }
      else setUserData(null);
    });
    return unsub;
  }, []);
  useEffect(() => {
      if (window.location.hash === "#admin") setView("admin");
  }, []);
  const playSong = useCallback((song, songList, idx) => {
    const list = shuffle ? [...songList].sort(() => Math.random() - 0.5) : songList;
    const newIdx = shuffle ? list.findIndex((s) => s.id === song.id) : idx;
    setQueue(list);
    setQueueIdx(newIdx >= 0 ? newIdx : 0);
    setCurrentTrack(song);
  }, [shuffle]);

  const togglePlay = () => { if (isPlaying) player.pause(); else player.play(); };

  const goNext = () => {
    const next = queueIdx + 1;
    if (next < queue.length) { setQueueIdx(next); setCurrentTrack(queue[next]); }
    else if (repeat === "all") { setQueueIdx(0); setCurrentTrack(queue[0]); }
  };

  const goPrev = () => {
    if (player.progress > 3) { player.seek(0); return; }
    const prev = queueIdx - 1;
    if (prev >= 0) { setQueueIdx(prev); setCurrentTrack(queue[prev]); }
  };

  const toggleLike = async (songId) => {
    if (!user) { setShowAuth(true); return; }
    const updated = likedSongs.includes(songId)
      ? likedSongs.filter((id) => id !== songId)
      : [...likedSongs, songId];
    setUserData((prev) => ({ ...prev, likedSongs: updated }));
    await saveUserLiked(user.uid, updated);
  };

  const handleCreatePlaylist = async () => {
    if (!user) { setShowAuth(true); return; }
    const name = prompt("Playlist name:");
    if (!name) return;
    const pl = { id: generateId(), name, songs: [], songIds: [] };
    setUserData((prev) => ({ ...prev, playlists: [...(prev?.playlists || []), pl] }));
    await saveUserPlaylist(user.uid, pl);
  };

  const handleSelectPlaylist = (pl) => {
    setSelectedPlaylist(pl);
    setView("playlist");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null); setUserData(null);
  };

  const renderMain = () => {
    if (view === "admin") return <AdminPanel />;
    if (view === "playlist" && selectedPlaylist)
      return <PlaylistView playlist={selectedPlaylist} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playSong} likedSongs={likedSongs} onLike={toggleLike} />;
    if (view === "liked")
      return <LikedView likedSongs={likedSongs} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playSong} onLike={toggleLike} />;
    if (view === "search")
      return <SearchView currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playSong} likedSongs={likedSongs} onLike={toggleLike} />;
    if (view === "library")
      return <LibraryView user={user} userPlaylists={userPlaylists} onSelectPlaylist={handleSelectPlaylist} onShowAuth={() => setShowAuth(true)} />;
    return <HomeView user={user} onSelectPlaylist={handleSelectPlaylist} currentTrack={currentTrack} onPlay={playSong} isPlaying={isPlaying} likedSongs={likedSongs} onLike={toggleLike} />;
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {!isMobile && (
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Sidebar view={view} setView={setView} user={user} userPlaylists={userPlaylists} onCreatePlaylist={handleCreatePlaylist} onSelectPlaylist={handleSelectPlaylist} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <TopBar user={user} onShowAuth={() => setShowAuth(true)} onSignOut={handleSignOut} />
              <div style={{ flex: 1, overflowY: "auto" }}>{renderMain()}</div>
            </div>
          </div>
        )}
        {isMobile && (
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
            <div style={{ padding: "16px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>♪ Musify</span>
              {user ? (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8435a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
              ) : (
                <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ padding: "6px 16px", fontSize: 12 }}>Log in</button>
              )}
            </div>
            {renderMain()}
          </div>
        )}
      </div>

      <PlayerBar track={currentTrack} isPlaying={isPlaying} onToggle={togglePlay}
        progress={player.progress} duration={player.duration}
        onSeek={player.seek} onNext={goNext} onPrev={goPrev}
        volume={player.volume} onVolume={player.setVol}
        liked={currentTrack ? likedSongs.includes(currentTrack.id) : false}
        onLike={() => currentTrack && toggleLike(currentTrack.id)}
        isMobile={isMobile} shuffle={shuffle} repeat={repeat}
        onShuffleToggle={() => setShuffle((s) => !s)}
        onRepeatToggle={() => setRepeat((r) => r === "off" ? "all" : r === "all" ? "one" : "off")} />

      {isMobile && <MobileNav view={view} setView={setView} />}
      {showAuth && <AuthView onClose={() => setShowAuth(false)} />}
    </>
  );
}
