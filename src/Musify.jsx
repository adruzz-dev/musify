import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, sendEmailVerification,
  onAuthStateChanged, signOut,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import {
  getStorage,
} from "firebase/storage";
import AdminPanel from "./AdminPanel";

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
    a.addEventListener("timeupdate", () => { setProgress(a.currentTime); });
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    };
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });
    return () => { a.pause(); clearTimeout(sleepTimerRef.current); };
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
      src.connect(gain);
      gain.connect(ctx.destination);
    } catch (e) { console.warn("WebAudio setup failed:", e); }
  }, []);

  const load = useCallback((url) => {
    const a = audioRef.current;
    if (!a) return Promise.resolve();
    if (gainRef.current) gainRef.current.gain.value = a.volume;
    a.src = url;
    a.load();
    return a.play().then(() => { if (!audioCtxRef.current) setupWebAudio(); }).catch((err) => console.warn("Audio play failed:", err));
  }, [setupWebAudio]);

  return {
    progress, duration,
    volume: Math.round(volume * 100),
    load,
    play: () => { const a = audioRef.current; if (!a) return; if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume(); a.play().catch(() => {}); },
    pause: () => audioRef.current?.pause(),
    seek: (r) => { const a = audioRef.current; if (!a) return; const d = a.duration; if (d && isFinite(d) && d > 0) a.currentTime = r * d; },
    setVol: (v) => { const val = v / 100; setVolume(val); if (audioRef.current) audioRef.current.volume = val; if (gainRef.current) gainRef.current.gain.value = val; },
  };
}

function CoverArt({ cover, size = 48, title, radius = 6 }) {
  const initials = title?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "♪";
  const sz = typeof size === "number" ? size : "100%";
  return cover ? (
    <img src={cover} alt={title} style={{ width: sz, height: sz, borderRadius: radius, objectFit: "cover", flexShrink: 0, display: "block" }} />
  ) : (
    <div style={{ width: sz, height: sz, borderRadius: radius, flexShrink: 0, background: "linear-gradient(135deg,#1db954 0%,#158a3e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: typeof size === "number" ? Math.max(10, size * 0.28) : 14, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
      {initials}
    </div>
  );
}

const Ico = {
  Home: ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "white" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
  Library: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>,
  Heart: ({ filled }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#1db954" : "none"} stroke={filled ? "#1db954" : "currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Pause: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Prev: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="2" height="16"/></svg>,
  Next: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16"/></svg>,
  Shuffle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>,
  Repeat: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
  RepeatOne: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>,
  Volume: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  Google: () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
  LogOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Circular+Std:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; background: #000; color: #fff; font-family: 'Outfit', sans-serif; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
    button { font-family: inherit; }

    .sidebar-item {
      display: flex; align-items: center; gap: 14px; padding: 10px 16px;
      border-radius: 6px; cursor: pointer; color: #b3b3b3; font-size: 14px;
      font-weight: 600; transition: all .15s; background: none; border: none;
      width: 100%; text-align: left;
    }
    .sidebar-item:hover { color: #fff; }
    .sidebar-item.active { color: #fff; }

    .song-row {
      display: grid; grid-template-columns: 32px 1fr 1fr 60px;
      align-items: center; gap: 16px; padding: 8px 16px;
      border-radius: 4px; cursor: pointer; transition: background .12s;
    }
    .song-row:hover { background: rgba(255,255,255,0.08); }
    .song-row.active { background: rgba(255,255,255,0.1); }
    .song-row .num { color: #b3b3b3; font-size: 14px; text-align: center; }
    .song-row.active .num { color: #1db954; }

    .icon-btn {
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 8px; border-radius: 50%; color: #b3b3b3; transition: all .15s;
    }
    .icon-btn:hover { color: #fff; transform: scale(1.06); }
    .icon-btn.active { color: #1db954; }

    .progress-bar {
      flex: 1; height: 4px; background: rgba(255,255,255,0.2);
      border-radius: 2px; cursor: pointer; position: relative;
    }
    .progress-bar:hover .progress-fill { background: #1db954; }
    .progress-bar:hover .progress-thumb { opacity: 1; }
    .progress-fill { height: 100%; background: #fff; border-radius: 2px; transition: width .1s linear; pointer-events: none; }
    .progress-thumb { position: absolute; top: 50%; right: -5px; transform: translateY(-50%); width: 12px; height: 12px; background: #fff; border-radius: 50%; opacity: 0; transition: opacity .15s; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }

    .volume-bar { width: 93px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; cursor: pointer; position: relative; }
    .volume-bar:hover .volume-fill { background: #1db954; }
    .volume-bar:hover .volume-thumb { opacity: 1; }
    .volume-fill { height: 100%; background: #fff; border-radius: 2px; pointer-events: none; }
    .volume-thumb { position: absolute; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #fff; border-radius: 50%; opacity: 0; transition: opacity .15s; pointer-events: none; }

    .card {
      background: #181818; border-radius: 8px; padding: 16px;
      cursor: pointer; transition: background .2s;
    }
    .card:hover { background: #282828; }

    .input-field {
      background: #3e3e3e; border: none; border-radius: 4px;
      padding: 12px 16px; color: #fff; font-size: 14px; font-family: inherit;
      outline: none; width: 100%; transition: background .15s;
    }
    .input-field:focus { background: #4a4a4a; box-shadow: 0 0 0 2px #fff; }
    .input-field::placeholder { color: #a7a7a7; }

    .btn-primary {
      background: #1db954; color: #000; border: none; border-radius: 500px;
      padding: 12px 32px; font-size: 14px; font-weight: 700; cursor: pointer;
      transition: all .15s; letter-spacing: .5px;
    }
    .btn-primary:hover { background: #1ed760; transform: scale(1.04); }

    .btn-outline {
      background: transparent; color: #fff;
      border: 1px solid rgba(255,255,255,0.3); border-radius: 500px;
      padding: 12px 32px; font-size: 14px; font-weight: 700; cursor: pointer;
      transition: all .15s; letter-spacing: .5px;
    }
    .btn-outline:hover { border-color: #fff; transform: scale(1.04); }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn .3s ease; }

    @media (max-width: 768px) {
      .song-row { grid-template-columns: 28px 1fr 44px; }
      .song-row .album-col { display: none; }
    }
  `}</style>
);

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

function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile, shuffle, repeat, onShuffleToggle, onRepeatToggle }) {
  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = progress && isFinite(progress) ? progress : 0;

  if (isMobile) {
    return (
      <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "#181818", borderTop: "1px solid #282828", padding: "10px 16px", zIndex: 200 }}>
        <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CoverArt cover={track?.cover} size={44} title={track?.title} radius={4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.title ?? "—"}</div>
            <div style={{ color: "#b3b3b3", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.artist ?? ""}</div>
          </div>
          <button className={`icon-btn${liked ? " active" : ""}`} onClick={onLike}><Ico.Heart filled={liked} /></button>
          <button className="icon-btn" onClick={onPrev}><Ico.Prev /></button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
          <button className="icon-btn" onClick={onNext}><Ico.Next /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 90, background: "#181818", borderTop: "1px solid #282828", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", alignItems: "center", padding: "0 24px", gap: 16, zIndex: 200 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <CoverArt cover={track?.cover} size={56} title={track?.title} radius={4} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.title ?? "—"}</div>
          <div style={{ color: "#b3b3b3", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track?.artist ?? ""}</div>
        </div>
        <button className={`icon-btn${liked ? " active" : ""}`} onClick={onLike} style={{ marginLeft: 4, flexShrink: 0 }}><Ico.Heart filled={liked} /></button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button className={`icon-btn${shuffle ? " active" : ""}`} onClick={onShuffleToggle}><Ico.Shuffle /></button>
          <button className="icon-btn" onClick={onPrev}><Ico.Prev /></button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform .1s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
          <button className="icon-btn" onClick={onNext}><Ico.Next /></button>
          <button className={`icon-btn${repeat !== "off" ? " active" : ""}`} onClick={onRepeatToggle}>
            {repeat === "one" ? <Ico.RepeatOne /> : <Ico.Repeat />}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ color: "#b3b3b3", fontSize: 11, minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatTime(safeProgress)}</span>
          <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ flex: 1 }} />
          <span style={{ color: "#b3b3b3", fontSize: 11, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>{formatTime(safeDuration)}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <button className="icon-btn"><Ico.Volume /></button>
        <div className="volume-bar"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onVolume(Math.round(((e.clientX - r.left) / r.width) * 100)); }}>
          <div className="volume-fill" style={{ width: `${volume}%` }} />
          <div className="volume-thumb" style={{ left: `calc(${volume}% - 6px)` }} />
        </div>
      </div>
    </div>
  );
}

function SongRow({ song, index, isActive, isPlaying, onPlay, liked, onLike }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={`song-row${isActive ? " active" : ""}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onDoubleClick={onPlay}>
      <div className="num">
        {hovered || isActive ? (
          <button onClick={onPlay} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            {isActive && isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
        ) : isActive ? <span style={{ color: "#1db954" }}>♫</span> : <span>{index + 1}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <CoverArt cover={song.cover} size={40} title={song.title} radius={4} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#1db954" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
          <div style={{ fontSize: 12, color: "#b3b3b3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
        </div>
      </div>
      <div className="album-col" style={{ fontSize: 14, color: "#b3b3b3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.album}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <button className={`icon-btn${liked ? " active" : ""}`} onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ opacity: hovered || liked ? 1 : 0, transition: "opacity .15s" }}>
          <Ico.Heart filled={liked} />
        </button>
      </div>
    </div>
  );
}

function Sidebar({ view, setView, user, userPlaylists, onCreatePlaylist, onSelectPlaylist, onSignOut }) {
  return (
    <div style={{ width: 240, background: "#000", display: "flex", flexDirection: "column", padding: "0 8px 16px", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ padding: "24px 16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 168 168"><path fill="#1db954" d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.6 121.2c-1.5 2.5-4.8 3.3-7.3 1.8-20-12.2-45.2-15-74.9-8.2-2.9.7-5.7-1.1-6.4-3.9-.7-2.9 1.1-5.7 3.9-6.4 32.5-7.4 60.4-4.2 82.9 9.5 2.5 1.5 3.3 4.7 1.8 7.2zm10.3-22.9c-1.9 3.1-5.9 4.1-9 2.2-22.9-14.1-57.8-18.2-84.9-9.9-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 30.9-9.4 69.3-4.8 95.6 11.3 3.1 1.9 4.1 6 2.2 9.1zm.9-23.8C108.2 59 63.6 57.5 38.5 65.1c-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 28.9-8.8 77-7.1 107.4 11.5 3.8 2.2 5 7.1 2.8 10.9-2.1 3.7-7 4.9-10.8 2.7l-.1.3z"/></svg>
        <span style={{ fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.5px" }}>Musify</span>
      </div>

      <div style={{ background: "#121212", borderRadius: 8, padding: "8px 0", marginBottom: 8 }}>
        <button className={`sidebar-item${view === "home" ? " active" : ""}`} onClick={() => setView("home")}>
          <Ico.Home filled={view === "home"} />
          <span>Home</span>
        </button>
        <button className={`sidebar-item${view === "search" ? " active" : ""}`} onClick={() => setView("search")}>
          <Ico.Search />
          <span>Search</span>
        </button>
      </div>

      <div style={{ background: "#121212", borderRadius: 8, flex: 1, padding: "8px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 12px" }}>
          <button className="sidebar-item" style={{ flex: 1, padding: "4px 0" }} onClick={() => setView("library")}>
            <Ico.Library />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Your Library</span>
          </button>
          {user && <button className="icon-btn" onClick={onCreatePlaylist} title="New playlist"><Ico.Plus /></button>}
        </div>

        {resolvePlaylists().map((pl) => (
          <button key={pl.id} className="sidebar-item" onClick={() => onSelectPlaylist(pl)}>
            <CoverArt cover={pl.cover} size={44} title={pl.name} radius={4} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</div>
              <div style={{ fontSize: 11, color: "#b3b3b3" }}>Playlist</div>
            </div>
          </button>
        ))}

        {user && (
          <button className={`sidebar-item${view === "liked" ? " active" : ""}`} onClick={() => setView("liked")}>
            <div style={{ width: 44, height: 44, borderRadius: 4, background: "linear-gradient(135deg,#450af5,#c4efd9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ico.Heart filled />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Liked Songs</div>
              <div style={{ fontSize: 11, color: "#b3b3b3" }}>Playlist</div>
            </div>
          </button>
        )}

        {userPlaylists?.map((pl) => (
          <button key={pl.id} className="sidebar-item" onClick={() => onSelectPlaylist(pl)}>
            <div style={{ width: 44, height: 44, borderRadius: 4, background: "#282828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>♪</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</div>
              <div style={{ fontSize: 11, color: "#b3b3b3" }}>Playlist</div>
            </div>
          </button>
        ))}

        {user && (
          <button className="sidebar-item" onClick={onSignOut} style={{ marginTop: "auto", color: "#b3b3b3" }}>
            <Ico.LogOut />
            <span>Log out</span>
          </button>
        )}
      </div>
    </div>
  );
}

function HomeView({ user, onSelectPlaylist, currentTrack, onPlay, isPlaying, likedSongs, onLike }) {
  const playlists = resolvePlaylists();
  const timeOfDay = new Date().getHours();
  const bgColor = timeOfDay < 12 ? "#1e3a5f" : timeOfDay < 17 ? "#3d1a78" : "#1a1a2e";

  return (
    <div className="fade-in" style={{ paddingBottom: 120 }}>
      <div style={{ background: `linear-gradient(180deg, ${bgColor} 0%, #121212 100%)`, padding: "60px 32px 32px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 28 }}>
          {getGreeting()}{user ? `, ${user.displayName?.split(" ")[0] || ""}` : ""}
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {playlists.map((pl) => (
            <div key={pl.id} onClick={() => onSelectPlaylist(pl)}
              style={{ display: "flex", alignItems: "center", gap: 0, background: "rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden", cursor: "pointer", transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
              <CoverArt cover={pl.cover} size={56} title={pl.name} radius={0} />
              <span style={{ padding: "0 16px", fontSize: 14, fontWeight: 700, color: "#fff" }}>{pl.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 20 }}>All Songs</h2>
        <div>
          <div className="song-row" style={{ padding: "8px 16px", marginBottom: 8, cursor: "default" }}>
            <div style={{ color: "#b3b3b3", fontSize: 13 }}>#</div>
            <div style={{ color: "#b3b3b3", fontSize: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Title</div>
            <div className="album-col" style={{ color: "#b3b3b3", fontSize: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Album</div>
            <div />
          </div>
          <div style={{ height: 1, background: "#282828", margin: "0 16px 8px" }} />
          {SONGS.map((song, i) => (
            <SongRow key={song.id} song={song} index={i}
              isActive={currentTrack?.id === song.id} isPlaying={isPlaying}
              onPlay={() => onPlay(song, SONGS, i)}
              liked={likedSongs.includes(song.id)}
              onLike={() => onLike(song.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchView({ currentTrack, isPlaying, onPlay, likedSongs, onLike }) {
  const [q, setQ] = useState("");
  const results = q.trim()
    ? SONGS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.artist.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div className="fade-in" style={{ padding: "32px 32px 120px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Search</h1>
      <div style={{ position: "relative", maxWidth: 480, marginBottom: 32 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#000" }}><Ico.Search /></span>
        <input className="input-field" placeholder="What do you want to listen to?" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ paddingLeft: 44, borderRadius: 500, background: "#fff", color: "#000", fontWeight: 600 }} />
      </div>
      {q ? (
        results.length > 0 ? (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Results</h2>
            {results.map((song, i) => (
              <SongRow key={song.id} song={song} index={i}
                isActive={currentTrack?.id === song.id} isPlaying={isPlaying}
                onPlay={() => onPlay(song, results, i)}
                liked={likedSongs.includes(song.id)}
                onLike={() => onLike(song.id)} />
            ))}
          </div>
        ) : (
          <div style={{ color: "#b3b3b3", textAlign: "center", marginTop: 60, fontSize: 15 }}>
            No results found for "<strong style={{ color: "#fff" }}>{q}</strong>"
          </div>
        )
      ) : (
        <p style={{ color: "#b3b3b3", fontSize: 14 }}>Search across {SONGS.length} songs</p>
      )}
    </div>
  );
}

function PlaylistView({ playlist, currentTrack, isPlaying, onPlay, likedSongs, onLike }) {
  const songs = playlist.songs || [];
  const colors = ["#1db954", "#e8435a", "#509bf5", "#ff6437", "#b49bc8"];
  const color = colors[playlist.id.charCodeAt(3) % colors.length] || "#1db954";

  return (
    <div className="fade-in" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "80px 32px 32px", background: `linear-gradient(180deg, ${color}66 0%, #121212 100%)`, display: "flex", alignItems: "flex-end", gap: 24 }}>
        <div style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)", flexShrink: 0 }}>
          <CoverArt cover={playlist.cover} size={200} title={playlist.name} radius={4} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Playlist</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>{playlist.name}</h1>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{songs.length} songs</div>
        </div>
      </div>
      <div style={{ padding: "24px 32px 0" }}>
        <div className="song-row" style={{ padding: "8px 16px", marginBottom: 8, cursor: "default" }}>
          <div style={{ color: "#b3b3b3", fontSize: 13 }}>#</div>
          <div style={{ color: "#b3b3b3", fontSize: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Title</div>
          <div className="album-col" style={{ color: "#b3b3b3", fontSize: 12, textTransform: "uppercase", letterSpacing: ".8px" }}>Album</div>
          <div />
        </div>
        <div style={{ height: 1, background: "#282828", margin: "0 16px 8px" }} />
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

function LikedView({ likedSongs, currentTrack, isPlaying, onPlay, onLike }) {
  const songs = SONGS.filter((s) => likedSongs.includes(s.id));
  return (
    <div className="fade-in" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "80px 32px 32px", background: "linear-gradient(180deg,#450af5 0%,#121212 100%)", display: "flex", alignItems: "flex-end", gap: 24 }}>
        <div style={{ width: 200, height: 200, borderRadius: 4, background: "linear-gradient(135deg,#450af5,#c4efd9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", flexShrink: 0 }}>♥</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Playlist</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Liked Songs</h1>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{songs.length} songs</div>
        </div>
      </div>
      <div style={{ padding: "24px 32px 0" }}>
        {songs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#b3b3b3", padding: "60px 0", fontSize: 14 }}>Songs you like will appear here.</div>
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

function LibraryView({ user, userPlaylists, onSelectPlaylist, onShowAuth }) {
  const playlists = resolvePlaylists();
  return (
    <div className="fade-in" style={{ padding: "32px 32px 120px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 24 }}>Your Library</h1>
      {!user && (
        <div style={{ background: "#121212", borderRadius: 12, padding: "24px", marginBottom: 28, textAlign: "center" }}>
          <p style={{ color: "#b3b3b3", fontSize: 14, marginBottom: 16 }}>Log in to see your library and liked songs</p>
          <button className="btn-primary" onClick={onShowAuth}>Log in</button>
        </div>
      )}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Playlists</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {playlists.map((pl) => (
          <div key={pl.id} className="card" onClick={() => onSelectPlaylist(pl)}>
            <CoverArt cover={pl.cover} size="100%" title={pl.name} radius={4} />
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: "#fff" }}>{pl.name}</div>
            <div style={{ fontSize: 12, color: "#b3b3b3", marginTop: 4 }}>Playlist</div>
          </div>
        ))}
        {userPlaylists?.map((pl) => (
          <div key={pl.id} className="card" onClick={() => onSelectPlaylist(pl)}>
            <div style={{ width: "100%", paddingTop: "100%", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: "#282828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>♪</div>
            </div>
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: "#fff" }}>{pl.name}</div>
            <div style={{ fontSize: 12, color: "#b3b3b3", marginTop: 4 }}>Playlist</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }}>
      <div style={{ background: "#121212", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 400, position: "relative" }}>
        <button className="icon-btn" onClick={onClose} style={{ position: "absolute", top: 16, right: 16 }}><Ico.X /></button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <svg width="48" height="48" viewBox="0 0 168 168" style={{ marginBottom: 12 }}><path fill="#1db954" d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.6 121.2c-1.5 2.5-4.8 3.3-7.3 1.8-20-12.2-45.2-15-74.9-8.2-2.9.7-5.7-1.1-6.4-3.9-.7-2.9 1.1-5.7 3.9-6.4 32.5-7.4 60.4-4.2 82.9 9.5 2.5 1.5 3.3 4.7 1.8 7.2zm10.3-22.9c-1.9 3.1-5.9 4.1-9 2.2-22.9-14.1-57.8-18.2-84.9-9.9-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 30.9-9.4 69.3-4.8 95.6 11.3 3.1 1.9 4.1 6 2.2 9.1zm.9-23.8C108.2 59 63.6 57.5 38.5 65.1c-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 28.9-8.8 77-7.1 107.4 11.5 3.8 2.2 5 7.1 2.8 10.9-2.1 3.7-7 4.9-10.8 2.7l-.1.3z"/></svg>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{mode === "login" ? "Log in to Musify" : "Sign up for Musify"}</h2>
        </div>

        <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "transparent", border: "1px solid #727272", borderRadius: 500, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "inherit", transition: "border-color .15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#fff"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#727272"}>
          <Ico.Google /> Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#282828" }} />
          <span style={{ color: "#727272", fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#282828" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && <input className="input-field" placeholder="What's your name?" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className="input-field" placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-field" placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          {err && <div style={{ color: "#e8435a", fontSize: 12, padding: "10px 14px", background: "rgba(232,67,90,0.1)", borderRadius: 6 }}>{err}</div>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 8, padding: "14px" }}>
            {loading ? "..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#727272" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, textDecoration: "underline" }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ user, onShowAuth, onSignOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ height: 64, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 32px", gap: 12, flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
      {user ? (
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#000", border: "none", borderRadius: 500, padding: "4px 4px 4px 4px", cursor: "pointer", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1db954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
              {user.displayName?.[0]?.toUpperCase() || "U"}
            </div>
            <span style={{ padding: "0 8px 0 4px" }}>{user.displayName?.split(" ")[0] || "Profile"}</span>
          </button>
          {open && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#282828", borderRadius: 8, padding: 4, minWidth: 180, boxShadow: "0 16px 40px rgba(0,0,0,0.7)", zIndex: 200 }}>
              {[
                { label: "Profile", action: () => setOpen(false) },
                { label: "Log out", action: () => { onSignOut(); setOpen(false); } },
              ].map(({ label, action }) => (
                <button key={label} onClick={action} style={{ width: "100%", background: "none", border: "none", color: "#fff", padding: "12px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, textAlign: "left", fontFamily: "inherit", fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-outline" onClick={onShowAuth} style={{ padding: "8px 24px", fontSize: 14 }}>Log in</button>
          <button className="btn-primary" onClick={onShowAuth} style={{ padding: "8px 24px", fontSize: 14 }}>Sign up</button>
        </div>
      )}
    </div>
  );
}

function MobileNav({ view, setView }) {
  const items = [
    { id: "home", label: "Home", Icon: Ico.Home },
    { id: "search", label: "Search", Icon: Ico.Search },
    { id: "library", label: "Library", Icon: Ico.Library },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 56, background: "#121212", borderTop: "1px solid #282828", display: "flex", zIndex: 300 }}>
      {items.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => setView(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: view === id ? "#fff" : "#b3b3b3", fontSize: 10, fontWeight: 600, fontFamily: "inherit", transition: "color .15s" }}>
          <Icon filled={view === id} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

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

  const handleSelectPlaylist = (pl) => { setSelectedPlaylist(pl); setView("playlist"); };
  const handleSignOut = async () => { await signOut(auth); setUser(null); setUserData(null); };

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
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#000" }}>
        {!isMobile && (
          <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 8, padding: 8, paddingBottom: 0 }}>
            <Sidebar view={view} setView={setView} user={user} userPlaylists={userPlaylists} onCreatePlaylist={handleCreatePlaylist} onSelectPlaylist={handleSelectPlaylist} onSignOut={handleSignOut} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#121212", borderRadius: 8 }}>
              <TopBar user={user} onShowAuth={() => setShowAuth(true)} onSignOut={handleSignOut} />
              <div style={{ flex: 1, overflowY: "auto" }}>{renderMain()}</div>
            </div>
          </div>
        )}
        {isMobile && (
          <div style={{ flex: 1, overflowY: "auto", background: "#121212" }}>
            <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#121212" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="24" height="24" viewBox="0 0 168 168"><path fill="#1db954" d="M84 0C37.6 0 0 37.6 0 84s37.6 84 84 84 84-37.6 84-84S130.4 0 84 0zm38.6 121.2c-1.5 2.5-4.8 3.3-7.3 1.8-20-12.2-45.2-15-74.9-8.2-2.9.7-5.7-1.1-6.4-3.9-.7-2.9 1.1-5.7 3.9-6.4 32.5-7.4 60.4-4.2 82.9 9.5 2.5 1.5 3.3 4.7 1.8 7.2zm10.3-22.9c-1.9 3.1-5.9 4.1-9 2.2-22.9-14.1-57.8-18.2-84.9-9.9-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 30.9-9.4 69.3-4.8 95.6 11.3 3.1 1.9 4.1 6 2.2 9.1zm.9-23.8C108.2 59 63.6 57.5 38.5 65.1c-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 28.9-8.8 77-7.1 107.4 11.5 3.8 2.2 5 7.1 2.8 10.9-2.1 3.7-7 4.9-10.8 2.7l-.1.3z"/></svg>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>Musify</span>
              </div>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1db954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#000" }}>
                    {user.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <button onClick={handleSignOut} style={{ background: "none", border: "1px solid #727272", borderRadius: 500, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Log out
                  </button>
                </div>
              ) : (
                <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ padding: "8px 20px", fontSize: 13 }}>Log in</button>
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
