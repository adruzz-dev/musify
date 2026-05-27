import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, sendEmailVerification,
  onAuthStateChanged, signOut, updateProfile,
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AdminPanel from "./AdminPanel";

// New Firebase Project Configuration Keys
const firebaseConfig = {
  apiKey: "AIzaSyChXUcH4fVCM8db2lA7OlrcYGQYXQP-2q0",
  authDomain: "musify-new-348db.firebaseapp.com",
  projectId: "musify-new-348db",
  storageBucket: "musify-new-348db.firebasestorage.app",
  messagingSenderId: "547789616528",
  appId: "1:547789616528:web:5cf41596300d6dfa93ef15",
  measurementId: "G-PFQQE1K6HD"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

const SONGS = [
  { id: "1", title: "Vaishakha Sandhye", artist: "KJ Yesudas", album: "Nadodikkattu", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779531012/Vaisakha_Sandhye_HD_Video_Song_Mohanlal_Shobana_-_Nadodikkattu_-_Saina_Music_youtube_u2fvmk.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779530849/images_p3p8bd.jpg" },
  { id: "2", title: "Jeevamshamayi", artist: "K S Harishankar & Shreya Ghoshal", album: "Theevandi", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779556908/Theevandi___Jeevamshamayi___Video_Song___August_Cinema___Kailas_Menon___Shreya_Ghoshal___Harisankar_DInfmi-YIiw_hogqum.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557549/images_wy9ybz.jpg" },
  { id: "3", title: "Aaradhikee", artist: "Madhuvanthi Narayan, Sooraj Santhosh", album: "Aaradhike", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557126/Aaradhike_Video_Song___Soubin_Shahir___E4_Entertainment___Johnpaul_George_dAezp422I_A_enjry4.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779561178/images_2_fuqfh9.jpg" },
  { id: "4", title: "Malare", artist: "Rajesh Murugesan, Vijay Yesudas", album: "Premam", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557149/Premam_Malare_Video_Song_Rajesh_Murugesan_Vijay_Yesudas_Nivin_Pauly_Sai_Pallavi_-_Anwar_Rasheed_Entertainment_Official_youtube_iplxn3.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557549/images_4_opydxc.jpg" },
  { id: "5", title: "Uyiril Thodum", artist: "Sushin Shyam, Sooraj Santhosh, Anne Amie", album: "Kumbalangi Nights", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557117/%E0%B4%89%E0%B4%AF%E0%B4%BF%E0%B4%B0%E0%B4%BF%E0%B5%BD_%E0%B4%A4%E0%B5%8A%E0%B4%9F%E0%B5%81%E0%B4%82_Uyiril_Thodum_-_Kumbalangi_Nights_Official_Video_Song___Sooraj_Santhosh___Anne_Amie_ZKhOs_Pc_7s_tyqluu.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557550/images_3_pwgkgc.jpg" },
  { id: "6", title: "Darshana", artist: "Vineeth Sreenivasan", album: "Hridayam", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557122/Darshana_-_Official_Video_Song___Hridayam___Pranav___Darshana___Vineeth___Hesham___Merryland_epAFDEJImrU_hsyy47.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557549/ab67616d00001e029b8c8ab6e0a59493a5fa06c6_pi7ztc.jpg" },
  { id: "7", title: "Pavizha Mazha", artist: "K.S. Harisankar", album: "Athiran", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779557116/Pavizha_Mazha___Athiran___Video___Fahad_Faasil___Sai_Pallavi___Vivek___K_S_Harisankar___P_S_Jayhari_P-jKtzUuVcM_z8j9j6.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779557550/images_1_qkeze0.jpg" },
  { id: "381104drf", title: "KAATTUCHEMBAKAM", artist: "JAKES BEJOY", album: "Pallichattambi", audioUrl: "https://res.cloudinary.com/dasnicvlp/video/upload/q_auto/f_auto/v1779856994/Pallichattambi_-_Kaattuchembakam_Video_Song__Tovino_Kayadu___Dijo_Jose__Jakes_Bejoy___Vishal_Mishra_kzpS-A3QJqE_wbzskr.mp3", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779857197/Kaattuchembakam-From-Pallichattambi-Malayalam-2026-20260212181402-500x500_1_j4dpbx.jpg" },
].filter((s) => s.id && s.title && s.audioUrl);

const PLAYLISTS = [
  { id: "pl-1", name: "Malayalam Melodies", cover: "https://res.cloudinary.com/dasnicvlp/image/upload/q_auto/f_auto/v1779449356/artworks-X7VgPpOQzk6r1htx-1zjCOA-t500x500_fhil3r.jpg", songIds: ["1","2","3","4","5","6","7"] },
];
const EQ_PRESETS = {
  Normal: [0, 0, 0],
  Rock: [5, -2, 5],
  Pop: [-2, 5, 2],
  Jazz: [3, -2, 3],
  Classical: [4, -1, 2],
  BassBoost: [7, 1, -2],
};
function resolvePlaylists() {
  return PLAYLISTS.map((pl) => ({ ...pl, songs: pl.songIds.map((sid) => SONGS.find((s) => s.id === sid)).filter(Boolean) }));
}

const getUserDoc = async (uid) => { const snap = await getDoc(doc(db,"users",uid)); return snap.exists() ? snap.data() : null; };
const createUserDoc = async (uid, data) => { await setDoc(doc(db,"users",uid), { name: data.name||"", email: data.email||"", avatarUrl:"", playlists:[], likedSongs:[], createdAt: Date.now() }); };
const saveUserLiked = async (uid, likedSongs) => updateDoc(doc(db,"users",uid), { likedSongs });
const saveUserPlaylist = async (uid, playlist) => updateDoc(doc(db,"users",uid), { playlists: arrayUnion(playlist) });
function formatTime(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2,"0")}`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 768); window.addEventListener("resize",h); return () => window.removeEventListener("resize",h); }, []);
  return isMobile;
}

function getGreeting() { const h = new Date().getHours(); if(h<12) return "Good morning"; if(h<17) return "Good afternoon"; return "Good evening"; }
function generateId() { return `pl-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

const durationCache = {};
function useSongDuration(audioUrl) {
  const [dur, setDur] = useState(durationCache[audioUrl] || 0);
  useEffect(() => {
    if (!audioUrl || durationCache[audioUrl]) return;
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.src = audioUrl;
    a.addEventListener("loadedmetadata", () => {
      durationCache[audioUrl] = a.duration;
      setDur(a.duration);
    });
  }, [audioUrl]);
  return dur;
}

function CoverArt({ cover, size=48, title, radius=6 }) {
  const initials = title?.split(" ").map((w)=>w[0]).join("").slice(0,2).toUpperCase() || "M";
  const sz = typeof size==="number" ? size : "100%";
  return cover ? (
    <img src={cover} alt={title} style={{ width:sz, height:sz, borderRadius:radius, objectFit:"cover", flexShrink:0, display:"block" }} />
  ) : (
    <div style={{ width:sz, height:sz, borderRadius:radius, flexShrink:0, background:"linear-gradient(135deg,#e8435a 0%,#7c1a2a 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:typeof size==="number"?Math.max(10,size*0.28):14, fontWeight:800, color:"rgba(255,255,255,0.9)" }}>
      {initials}
    </div>
  );
}

function MusifyLogo({ size = 32, style = {} }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "22%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#000", border: "1px solid rgba(255,50,50,0.2)", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", ...style }}>
      <img src="https://res.cloudinary.com/dasnicvlp/image/upload/v1779857197/1000081221.png" alt="Musify Logo" style={{ width: "105%", height: "105%", objectFit: "cover" }} />
    </div>
  );
}

const Ico = {
  Home: ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
  Library: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>,
  Heart: ({ filled }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled?"#e8435a":"none"} stroke={filled?"#e8435a":"currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Pause: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Prev: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="2" height="16"/></svg>,
  Next: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16"/></svg>,
  Shuffle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>,
  Repeat: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
  RepeatOne: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>,
  Volume: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18 1.42-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>,
  LogOut: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  Google: () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ChevronDown: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  MoreVertical: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
  Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Cast: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><line x1="2" y1="20" x2="2.01" y2="20"/></svg>,
  List: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; background: #0a0a0f; color: #e8e8e8; font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    button { font-family: inherit; }
    .sidebar-item { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:8px; cursor:pointer; color:#aaa; font-size:14px; font-weight:500; transition:all .15s; background:none; border:none; width:100%; text-align:left; }
    .sidebar-item:hover { color:#fff; background:rgba(255,255,255,0.07); }
    .sidebar-item.active { color:#fff; background:rgba(232,67,90,0.15); }
    .song-row { display:grid; grid-template-columns:32px 1fr 1fr 56px; align-items:center; gap:12px; padding:8px 16px; border-radius:6px; cursor:pointer; transition:background .12s; }
    .song-row:hover { background:rgba(255,255,255,0.06); }
    .song-row.active { background:rgba(232,67,90,0.08); }
    .song-row .num { color:#888; font-size:13px; text-align:center; }
    .song-row.active .num { color:#e8435a; }
    .icon-btn { background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:6px; border-radius:50%; color:#888; transition:all .15s; }
    .icon-btn:hover { color:#fff; background:rgba(255,255,255,0.08); }
    .icon-btn.active { color:#e8435a; }
    .progress-bar { flex:1; height:4px; background:rgba(255,255,255,0.15); border-radius:2px; cursor:pointer; position:relative; }
    .progress-bar:hover .progress-fill { background:#e8435a; }
    .progress-bar:hover .progress-thumb { opacity:1; }
    .progress-fill { height:100%; background:#fff; border-radius:2px; transition:width .1s linear; pointer-events:none; }
    .progress-thumb { position:absolute; top:50%; right:-5px; transform:translateY(-50%); width:12px; height:12px; background:#fff; border-radius:50%; opacity:0; transition:opacity .15s; pointer-events:none; }
    .volume-bar { width:80px; height:4px; background:rgba(255,255,255,0.15); border-radius:2px; cursor:pointer; position:relative; }
    .volume-fill { height:100%; background:#fff; border-radius:2px; }
    .card { background:#111118; border-radius:10px; padding:14px; cursor:pointer; transition:background .15s; }
    .card:hover { background:#1a1a24; }
    .input-field { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:11px 14px; color:#e8e8e8; font-size:14px; font-family:inherit; outline:none; width:100%; transition:border .15s; }
    .input-field:focus { border-color:#e8435a; }
    .btn-primary { background:#e8435a; color:#fff; border:none; border-radius:500px; padding:12px 32px; font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; }
    .btn-primary:hover { background:#ff5570; transform:scale(1.02); }
    .btn-outline { background:transparent; color:#e8e8e8; border:1px solid rgba(255,255,255,0.25); border-radius:500px; padding:12px 32px; font-size:14px; font-weight:600; cursor:pointer; transition:all .15s; }
    .btn-outline:hover { border-color:#fff; }
    .toggle-track { width:44px; height:24px; border-radius:12px; cursor:pointer; border:none; transition:background .2s; position:relative; flex-shrink:0; }
    .toggle-thumb { width:18px; height:18px; background:#fff; border-radius:50%; position:absolute; top:3px; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,0.4); }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fade-in { animation:fadeIn .25s ease; }
    @keyframes slideIn { from{transform:translateY(100%)} to{transform:translateY(0)} }
    .slide-in { animation:slideIn .3s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .eq-slider-container { display: flex; flex-direction: column; gap: 12px; padding: 6px 0; }
    .eq-slider-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #f0f0f0; font-size: 14px; }
    .eq-label { width: 56px; font-weight: 500; color: rgba(255,255,255,0.6); }
    .eq-slider { flex: 1; accent-color: #e8435a; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
    .eq-value { width: 44px; text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 600; }
    @media (max-width:768px) { .song-row { grid-template-columns:28px 1fr 52px; } .song-row .album-col { display:none; } }
  `}</style>
);

function SeekBar({ progress, duration, onSeek, style={} }) {
  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = progress && isFinite(progress) ? progress : 0;
  const pct = safeDuration > 0 ? (safeProgress / safeDuration) * 100 : 0;
  return (
    <div className="progress-bar" style={style} onClick={(e) => { const r=e.currentTarget.getBoundingClientRect(); onSeek((e.clientX-r.left)/r.width); }}>
      <div className="progress-fill" style={{ width:`${pct}%` }} />
      <div className="progress-thumb" style={{ left:`${pct}%`, right:"unset" }} />
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button className="toggle-track" onClick={() => onChange(!value)} style={{ background: value ? "#e8435a" : "rgba(255,255,255,0.15)" }}>
      <div className="toggle-thumb" style={{ left: value ? "23px" : "3px" }} />
    </button>
  );
}

function useAudioPlayer(onEnded, onPlayStateChange, playbackSettings, onEqChange) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const bassFilterRef = useRef(null);
  const midFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const unlockedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const settingsRef = useRef(playbackSettings);
  useEffect(() => { settingsRef.current = playbackSettings; }, [playbackSettings]);

  useEffect(() => {
    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      bassFilterRef.current?.gain.setTargetAtTime(playbackSettings.bass, now, 0.1);
      midFilterRef.current?.gain.setTargetAtTime(playbackSettings.mid, now, 0.1);
      trebleFilterRef.current?.gain.setTargetAtTime(playbackSettings.treble, now, 0.1);
    }
  }, [playbackSettings.bass, playbackSettings.mid, playbackSettings.treble]);
  useEffect(() => {
    if (audioCtxRef.current && EQ_PRESETS[playbackSettings.eqPreset]) {
      const [b, m, t] = EQ_PRESETS[playbackSettings.eqPreset];
      onEqChange?.(b, m, t);
    }
  }, [playbackSettings.eqPreset]);
  useEffect(() => {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.volume = volume;
    audioRef.current = a;
    a.addEventListener("ended", () => onEnded?.());
    a.addEventListener("play", () => onPlayStateChange?.(true));
    a.addEventListener("pause", () => onPlayStateChange?.(false));
    a.addEventListener("timeupdate", () => setProgress(a.currentTime));
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
  
    const unlock = () => { if(unlockedRef.current) return; unlockedRef.current=true; if(audioCtxRef.current?.state==="suspended") audioCtxRef.current.resume(); };
    document.addEventListener("touchstart", unlock, { once:true });
    document.addEventListener("click", unlock, { once:true });
    
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

      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 200;
      bass.gain.value = settingsRef.current.bass;
      bassFilterRef.current = bass;

      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.Q.value = 1.0;
      mid.frequency.value = 1000;
      mid.gain.value = settingsRef.current.mid;
      midFilterRef.current = mid;

      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 5000;
      treble.gain.value = settingsRef.current.treble;
      trebleFilterRef.current = treble;

      src.connect(gain);
      gain.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(ctx.destination);
    } catch(e) { console.warn("WebAudio failed:", e); }
  }, [volume]);
  const load = useCallback((url) => {
    const a = audioRef.current;
    if (!a) return Promise.resolve();
    if (gainRef.current) gainRef.current.gain.value = a.volume;
    a.src = url;
    a.load();
    return a.play().then(() => { if(!audioCtxRef.current) setupWebAudio(); }).catch((err) => console.warn("Play failed:", err));
  }, [setupWebAudio]);
  const setSleepTimer = useCallback((minutes) => {
    clearTimeout(sleepTimerRef.current);
    if (minutes > 0) sleepTimerRef.current = setTimeout(() => audioRef.current?.pause(), minutes * 60 * 1000);
  }, []);
  return {
    progress, duration,
    volume: Math.round(volume * 100),
    load,
    play: () => { const a = audioRef.current; if(!a) return; if(audioCtxRef.current?.state==="suspended") audioCtxRef.current.resume(); a.play().catch(()=>{}); },
    pause: () => audioRef.current?.pause(),
    seek: (r) => { const a = audioRef.current; if(!a) return; const d = a.duration; if(d && isFinite(d) && d>0) a.currentTime = r*d; },
    setVol: (v) => { const val = v/100; setVolume(val); if(audioRef.current) audioRef.current.volume=val; if(gainRef.current) gainRef.current.gain.value=val; },
    setSleepTimer,
  };
}

function SongRow({ song, index, isActive, isPlaying, onPlay, liked, onLike }) {
  const duration = useSongDuration(song.audioUrl);
  return (
    <div className={`song-row${isActive ? " active" : ""}`} onClick={onPlay}>
      <div className="num">
        {isActive && isPlaying ? ( <span style={{ color: "#e8435a" }}>▶</span> ) : ( index + 1 )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <CoverArt cover={song.cover} size={40} title={song.title} radius={4} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#e8435a" : "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.title}
          </div>
          <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.artist}
          </div>
        </div>
      </div>
      <div className="album-col" style={{ fontSize: 13, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {song.album}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <button className={`icon-btn${liked ? " active" : ""}`} onClick={(e) => { e.stopPropagation(); onLike(); }} >
          <Ico.Heart filled={liked} />
        </button>
        <span style={{ fontSize: 12, color: "#888", fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right" }}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

function PlayerBar({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, volume, onVolume, liked, onLike, isMobile, shuffle, repeat, onShuffleToggle, onRepeatToggle, onExpand }) {
  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = progress && isFinite(progress) ? progress : 0;
  if (isMobile) {
    return (
      <div onClick={onExpand} style={{ position:"fixed", bottom:56, left:0, right:0, background:"#111118", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"10px 16px", zIndex:200, cursor: "pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <span style={{ color:"#888", fontSize:11, minWidth:32, textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{formatTime(safeProgress)}</span>
          <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ flex:1 }} />
          <span style={{ color:"#888", fontSize:11, minWidth:32, fontVariantNumeric:"tabular-nums" }}>{formatTime(safeDuration)}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <CoverArt cover={track?.cover} size={40} title={track?.title} radius={4} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:"#f0f0f0", fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track?.title ?? "-"}</div>
            <div style={{ color:"#888", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track?.artist ?? ""}</div>
          </div>
          <button className={`icon-btn${liked?" active":""}`} onClick={(e) => { e.stopPropagation(); onLike(); }}><Ico.Heart filled={liked} /></button>
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ width:36, height:36, borderRadius:"50%", background:"#e8435a", border:"none", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, height:90, background:"#0d0d14", borderTop:"1px solid rgba(255,255,255,0.07)", display:"grid", gridTemplateColumns:"1fr 2fr 1fr", alignItems:"center", padding:"0 24px", gap:16, zIndex:200 }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
        <CoverArt cover={track?.cover} size={54} title={track?.title} radius={4} />
        <div style={{ minWidth:0 }}>
          <div style={{ color:"#f0f0f0", fontSize:14, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track?.title ?? "-"}</div>
          <div style={{ color:"#888", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track?.artist ?? ""}</div>
        </div>
        <button className={`icon-btn${liked?" active":""}`} onClick={onLike} style={{ marginLeft:4, flexShrink:0 }}><Ico.Heart filled={liked} /></button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <button className={`icon-btn${shuffle?" active":""}`} onClick={onShuffleToggle}><Ico.Shuffle /></button>
          <button className="icon-btn" onClick={onPrev}><Ico.Prev /></button>
          <button onClick={onToggle} style={{ width:36, height:36, borderRadius:"50%", background:"#fff", border:"none", cursor:"pointer", color:"0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform .1s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            {isPlaying ? <Ico.Pause /> : <Ico.Play />}
          </button>
          <button className="icon-btn" onClick={onNext}><Ico.Next /></button>
          <button className={`icon-btn${repeat!=="off"?" active":""}`} onClick={onRepeatToggle}>
            {repeat==="one" ? <Ico.RepeatOne /> : <Ico.Repeat />}
          </button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
          <span style={{ color:"#888", fontSize:11, minWidth:36, textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{formatTime(safeProgress)}</span>
          <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ flex:1 }} />
          <span style={{ color:"#888", fontSize:11, minWidth:36, fontVariantNumeric:"tabular-nums" }}>{formatTime(safeDuration)}</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
        <button className="icon-btn"><Ico.Volume /></button>
        <div className="volume-bar" onClick={(e)=>{ const r=e.currentTarget.getBoundingClientRect(); onVolume(Math.round(((e.clientX-r.left)/r.width)*100)); }}>
          <div className="volume-fill" style={{ width:`${volume}%` }} />
        </div>
      </div>
    </div>
  );
}

function FullScreenPlayer({ track, isPlaying, onToggle, progress, duration, onSeek, onNext, onPrev, shuffle, repeat, onShuffleToggle, onRepeatToggle, liked, onLike, onClose, onOpenSettings }) {
  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = progress && isFinite(progress) ? progress : 0;
  return (
    <div className="slide-in" style={{ position: "fixed", inset: 0, zIndex: 999, background: "#111", display: "flex", flexDirection: "column", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -40, backgroundImage: `url(${track?.cover})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(40px) brightness(0.35)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding: 0 }}><Ico.ChevronDown /></button>
          <div style={{ textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "rgba(255,255,255,0.7)" }}>
            PLAYING FROM PLAYLIST<br/><span style={{ color:"#fff", fontSize: 13, letterSpacing: 0, marginTop: 4, display: "block" }}>{track?.album || "Library"}</span>
          </div>
          <button onClick={onOpenSettings} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding: 0 }}><Ico.MoreVertical /></button>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 30 }}>
          <img src={track?.cover} alt={track?.title} style={{ width: "100%", maxWidth: 360, aspectRatio: "1/1", objectFit: "cover", borderRadius: 8, boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div style={{ minWidth: 0, flex: 1, paddingRight: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow:"ellipsis" }}>{track?.title}</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow:"ellipsis" }}>{track?.artist}</p>
          </div>
          <button onClick={onLike} style={{ background:"none", border:"none", color: liked ? "#e8435a" : "#fff", padding: 8, cursor:"pointer" }}><Ico.Heart filled={liked} /></button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SeekBar progress={safeProgress} duration={safeDuration} onSeek={onSeek} style={{ height: 4, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
            <span>{formatTime(safeProgress)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button onClick={onShuffleToggle} style={{ background:"none", border:"none", color: shuffle ? "#e8435a" : "rgba(255,255,255,0.7)", cursor:"pointer" }}><Ico.Shuffle /></button>
          <button onClick={onPrev} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", transform: "scale(1.5)" }}><Ico.Prev /></button>
          <button onClick={onToggle} style={{ width: 68, height: 68, borderRadius: "50%", background: "#fff", color: "#000", border: "none", display: "flex", alignItems: "center", justifyContent:"center", cursor:"pointer" }}>
            <div style={{ transform: "scale(1.6)", display:"flex" }}>{isPlaying ? <Ico.Pause /> : <Ico.Play />}</div>
          </button>
          <button onClick={onNext} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", transform: "scale(1.5)" }}><Ico.Next /></button>
          <button onClick={onRepeatToggle} style={{ background:"none", border:"none", color: repeat !== "off" ? "#e8435a" : "rgba(255,255,255,0.7)", cursor:"pointer" }}>
            {repeat === "one" ? <Ico.RepeatOne /> : <Ico.Repeat />}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, color: "rgba(255,255,255,0.7)" }}>
          <button style={{ background:"none", border:"none", color:"inherit", cursor:"pointer" }}><Ico.Cast /></button>
          <div style={{ display: "flex", gap: 24 }}>
            <button style={{ background:"none", border:"none", color:"inherit", cursor:"pointer" }}><Ico.Share /></button>
            <button style={{ background:"none", border:"none", color:"inherit", cursor:"pointer" }}><Ico.List /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybackSettings({ settings, onChange, onSleepTimer, onClose }) {
  const [sleepMin, setSleepMin] = useState(0);
  const row = (label, desc, key, type="toggle", options=null) => (
    <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:"#f0f0f0" }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:"#777", marginTop:2 }}>{desc}</div>}
      </div>
      {type==="toggle" && <Toggle value={settings[key]} onChange={(v) => onChange(key, v)} />}
      {type==="select" && (
        <select value={settings[key]} onChange={(e) => onChange(key, e.target.value)} style={{ background:"#1a1a24", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"#e8e8e8", padding:"6px 10px", fontSize:13, fontFamily:"inherit", outline:"none" }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  );
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div className="fade-in" style={{ width:"100%", maxWidth:480, margin:"0 auto", background:"#111118", borderRadius:"16px 16px 0 0", padding:"24px 24px 40px", maxHeight:"80vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:"#fff" }}>Playback Settings</h2>
          <button className="icon-btn" onClick={onClose}><Ico.X /></button>
        </div>
        {row("Shuffle", "Play songs in random order", "shuffle")}
        {row("Repeat", "Loop playback mode", "repeat", "select", [{value:"off",label:"Off"},{value:"all",label:"Repeat All"},{value:"one",label:"Repeat One"}])}
        {row("Equalizer Preset", "Choose frequency configuration", "eqPreset", "select", [{value:"Normal",label:"Normal"},{value:"Rock",label:"Rock"},{value:"Pop",label:"Pop"},{value:"Jazz",label:"Jazz"},{value:"Classical",label:"Classical"},{value:"BassBoost",label:"Bass Boost"}])}
        <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", marginBottom: 16 }}>Manual Equalizer Tuning</div>
          <div className="eq-slider-container">
            <div className="eq-slider-row">
              <span className="eq-label">Bass</span>
              <input type="range" min="-10" max="10" step="0.5" className="eq-slider" value={settings.bass} onChange={(e) => onChange("bass", parseFloat(e.target.value))} />
              <span className="eq-value">{settings.bass > 0 ? `+${settings.bass}` : settings.bass}dB</span>
            </div>
            <div className="eq-slider-row">
              <span className="eq-label">Mid</span>
              <input type="range" min="-10" max="10" step="0.5" className="eq-slider" value={settings.mid} onChange={(e) => onChange("mid", parseFloat(e.target.value))} />
              <span className="eq-value">{settings.mid > 0 ? `+${settings.mid}` : settings.mid}dB</span>
            </div>
            <div className="eq-slider-row">
              <span className="eq-label">Treble</span>
              <input type="range" min="-10" max="10" step="0.5" className="eq-slider" value={settings.treble} onChange={(e) => onChange("treble", parseFloat(e.target.value))} />
              <span className="eq-value">{settings.treble > 0 ? `+${settings.treble}` : settings.treble}dB</span>
            </div>
          </div>
        </div>
        {row("Crossfade", "Smooth transition between songs", "crossfade")}
        {row("Normalize Volume", "Keep volume consistent across songs", "normalize")}
        {row("High Quality Audio", "Stream at highest quality (uses more data)", "hqAudio")}
        <div style={{ padding:"14px 0" }}>
          <div style={{ fontSize:14, fontWeight:600, color:"#f0f0f0", marginBottom:6 }}>Sleep Timer</div>
          <div style={{ fontSize:12, color:"#777", marginBottom:12 }}>Automatically pause after a set time</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[0,15,30,45,60,90].map(m => (
              <button key={m} onClick={() => { setSleepMin(m); onSleepTimer(m); }} style={{ background: sleepMin===m?"#e8435a":"rgba(255,255,255,0.08)", border:"none", borderRadius:500, padding:"8px 16px", color: sleepMin===m?"#fff":"#aaa", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>{m===0?"Off":`${m} min`}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSidebar({ open, onClose, view, setView, user, userPlaylists, onCreatePlaylist, onSelectPlaylist, onShowAuth, onSignOut, onOpenSettings }) {
  if (!open) return null;
  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:400 }} onClick={onClose} />
      <div className="slide-in" style={{ position:"fixed", top:0, left:0, bottom:0, width:280, background:"#0d0d14", zIndex:401, display:"flex", flexDirection:"column", overflowY:"auto", padding:"0 8px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <MusifyLogo size={28} />
            <span style={{ fontWeight:800, fontSize:18, color:"#fff" }}>Musify</span>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico.X /></button>
        </div>
        {user ? (
          <div style={{ margin:"0 8px 16px", background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"#e8435a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0 }}>{user.displayName?.[0]?.toUpperCase() || "U"}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.displayName || "User"}</div>
              <div style={{ fontSize:11, color:"#888", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
            </div>
          </div>
        ) : (
          <div style={{ margin:"0 8px 16px", display:"flex", gap:8 }}>
            <button className="btn-primary" onClick={()=>{onShowAuth();onClose();}} style={{ flex:1, padding:"10px", fontSize:13 }}>Log in</button>
            <button className="btn-outline" onClick={()=>{onShowAuth();onClose();}} style={{ flex:1, padding:"10px", fontSize:13 }}>Sign up</button>
          </div>
        )}
        <button className={`sidebar-item${view==="home"?" active":""}`} onClick={()=>{setView("home");onClose();}}><Ico.Home filled={view==="home"} /><span>Home</span></button>
        <button className={`sidebar-item${view==="search"?" active":""}`} onClick={()=>{setView("search");onClose();}}><Ico.Search /><span>Search</span></button>
        <button className={`sidebar-item${view==="library"?" active":""}`} onClick={()=>{setView("library");onClose();}}><Ico.Library /><span>Your Library</span></button>
        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 8px" }} />
        <div style={{ padding:"4px 14px 8px", fontSize:11, fontWeight:700, color:"#666", textTransform:"uppercase", letterSpacing:".8px" }}>Playlists</div>
        {resolvePlaylists().map((pl) => (
          <button key={pl.id} className="sidebar-item" onClick={()=>{onSelectPlaylist(pl);onClose();}}>
            <CoverArt cover={pl.cover} size={36} title={pl.name} radius={4} />
            <span style={{ fontSize:13 }}>{pl.name}</span>
          </button>
        ))}
        {user && (
          <button className={`sidebar-item${view==="liked"?" active":""}`} onClick={()=>{setView("liked");onClose();}}>
            <div style={{ width:36, height:36, borderRadius:4, background:"linear-gradient(135deg,#7c1a2a,#e8435a)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Ico.Heart filled /></div>
            <span style={{ fontSize:13 }}>Liked Songs</span>
          </button>
        )}
        {userPlaylists?.map((pl) => (
          <button key={pl.id} className="sidebar-item" onClick={()=>{onSelectPlaylist(pl);onClose();}}>
            <div style={{ width:36, height:36, borderRadius:4, background:"#1a1a24", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, fontWeight:700 }}>M</div>
            <span style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pl.name}</span>
          </button>
        ))}
        {user && (
          <button className="sidebar-item" onClick={onCreatePlaylist}>
            <div style={{ width:36, height:36, borderRadius:4, background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Ico.Plus /></div>
            <span style={{ fontSize:13 }}>New Playlist</span>
          </button>
        )}
        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 8px" }} />
        <button className="sidebar-item" onClick={()=>{onOpenSettings();onClose();}}><Ico.Settings /><span>Settings</span></button>
        {user && <button className="sidebar-item" onClick={()=>{onSignOut();onClose();}} style={{ color:"#e8435a" }}><Ico.LogOut /><span>Log out</span></button>}
      </div>
    </>
  );
}

function Sidebar({ view, setView, user, userPlaylists, onCreatePlaylist, onSelectPlaylist, onSignOut, onOpenSettings }) {
  return (
    <div style={{ width:240, background:"#0a0a0f", display:"flex", flexDirection:"column", gap:2, padding:"16px 8px", overflowY:"auto", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ padding:"8px 12px 20px", display:"flex", alignItems:"center", gap:8 }}>
        <MusifyLogo size={30} />
        <span style={{ fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"-0.5px" }}>Musify</span>
      </div>
      <button className={`sidebar-item${view==="home"?" active":""}`} onClick={()=>setView("home")}><Ico.Home filled={view==="home"} /><span>Home</span></button>
      <button className={`sidebar-item${view==="search"?" active":""}`} onClick={()=>setView("search")}><Ico.Search /><span>Search</span></button>
      <button className={`sidebar-item${view==="library"?" active":""}`} onClick={()=>setView("library")}><Ico.Library /><span>Your Library</span></button>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 4px" }} />
      <div style={{ padding:"4px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#666", fontWeight:700, textTransform:"uppercase", letterSpacing:".8px" }}>Playlists</span>
        {user && <button className="icon-btn" onClick={onCreatePlaylist}><Ico.Plus /></button>}
      </div>
      {resolvePlaylists().map((pl) => (
        <button key={pl.id} className="sidebar-item" onClick={()=>onSelectPlaylist(pl)}>
          <CoverArt cover={pl.cover} size={32} title={pl.name} radius={3} />
          <span style={{ fontSize:13 }}>{pl.name}</span>
        </button>
      ))}
      {user && (
        <button className={`sidebar-item${view==="liked"?" active":""}`} onClick={()=>setView("liked")}>
          <div style={{ width:32, height:32, borderRadius:3, background:"linear-gradient(135deg,#7c1a2a,#e8435a)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Ico.Heart filled /></div>
          <span style={{ fontSize:13 }}>Liked Songs</span>
        </button>
      )}
      {userPlaylists?.map((pl) => (
        <button key={pl.id} className="sidebar-item" onClick={()=>onSelectPlaylist(pl)}>
          <div style={{ width:32, height:32, borderRadius:3, background:"#1a1a24", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, fontWeight:700 }}>M</div>
          <span style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pl.name}</span>
        </button>
      ))}
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 4px" }} />
      <button className="sidebar-item" onClick={onOpenSettings}><Ico.Settings /><span>Settings</span></button>
      {user && <button className="sidebar-item" onClick={onSignOut} style={{ color:"#e8435a" }}><Ico.LogOut /><span>Log out</span></button>}
    </div>
  );
}

function HomeView({ user, onSelectPlaylist, currentTrack, onPlay, isPlaying, likedSongs, onLike }) {
  const playlists = resolvePlaylists();
  return (
    <div className="fade-in" style={{ paddingBottom:120 }}>
      <div style={{ background:"linear-gradient(180deg,#1e0a0f 0%,#0f0f16 100%)", padding:"48px 32px 32px" }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", marginBottom:24 }}>{getGreeting()}{user?`, ${user.displayName?.split(" ")[0]||""}`:""}!</h1>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
          {playlists.map((pl) => (
            <div key={pl.id} onClick={()=>onSelectPlaylist(pl)} style={{ display:"flex", alignItems:"center", gap:0, background:"rgba(255,255,255,0.08)", borderRadius:6, overflow:"hidden", cursor:"pointer", transition:"background .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"}>
              <CoverArt cover={pl.cover} size={56} title={pl.name} radius={0} />
              <span style={{ padding:"0 16px", fontSize:14, fontNavgweight:800, color:"#fff" }}>{pl.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:"28px 32px" }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:16 }}>All Songs</h2>
        <div className="song-row" style={{ padding:"6px 16px", marginBottom:6, cursor:"default" }}>
          <div style={{ color:"#888", fontSize:12 }}>#</div>
          <div style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:".8px" }}>Title</div>
          <div className="album-col" style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:".8px" }}>Album</div>
          <div style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:".8px", textAlign:"right", display:"flex", alignItems:"center", justifyContent:"flex-end" }}><Ico.Clock /></div>
        </div>
        <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:8 }} />
        {SONGS.map((song,i) => (
          <SongRow key={song.id} song={song} index={i} isActive={currentTrack?.id===song.id} isPlaying={isPlaying} onPlay={()=>onPlay(song,SONGS,i)} liked={likedSongs.includes(song.id)} onLike={()=>onLike(song.id)} />
        ))}
      </div>
    </div>
  );
}

function SearchView({ currentTrack, isPlaying, onPlay, likedSongs, onLike }) {
  const [q, setQ] = useState("");
  const results = q.trim() ? SONGS.filter((s)=>s.title.toLowerCase().includes(q.toLowerCase())||s.artist.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div className="fade-in" style={{ padding:"32px 32px 120px" }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:20 }}>Search</h1>
      <div style={{ position:"relative", maxWidth:480, marginBottom:28 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#888" }}><Ico.Search /></span>
        <input className="input-field" placeholder="What do you want to listen to?" value={q} onChange={(e)=>setQ(e.target.value)} style={{ paddingLeft:44, borderRadius:500 }} />
      </div>
      {q ? results.length>0 ? (
        results.map((song,i) => (
          <SongRow key={song.id} song={song} index={i} isActive={currentTrack?.id===song.id} isPlaying={isPlaying} onPlay={()=>onPlay(song,results,i)} liked={likedSongs.includes(song.id)} onLike={()=>onLike(song.id)} />
        ))
      ) : (
        <div style={{ color:"#888", textAlign:"center", marginTop:60, fontSize:15 }}>No results for "<strong style={{color:"#ccc"}}>{q}</strong>"</div>
      ) : (
        <p style={{ color:"#888", fontSize:14 }}>Search across {SONGS.length} songs</p>
      )}
    </div>
  );
}

function PlaylistView({ playlist, currentTrack, isPlaying, onPlay, likedSongs, onLike }) {
  const songs = playlist.songs || [];
  return (
    <div className="fade-in" style={{ paddingBottom:120 }}>
      <div style={{ padding:"48px 32px 32px", background:"linear-gradient(180deg,rgba(232,67,90,0.3) 0%,transparent 100%)", display:"flex", alignItems:"flex-end", gap:28 }}>
        <div style={{ boxShadow:"0 8px 24px rgba(0,0,0,0.5)", flexShrink:0 }}><CoverArt cover={playlist.cover} size={180} title={playlist.name} radius={4} /></div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#ccc", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:8 }}>Playlist</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:12 }}>{playlist.name}</h1>
          <div style={{ fontSize:13, color:"#aaa" }}>{songs.length} songs</div>
        </div>
      </div>
      <div style={{ padding:"0 16px" }}>
        <div className="song-row" style={{ padding:"8px 16px", marginBottom:4, cursor:"default" }}>
          <div style={{ color:"#888", fontSize:12 }}>#</div>
          <div style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:".8px" }}>Title</div>
          <div className="album-col" style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:".8px" }}>Album</div>
          <div style={{ color:"#888", textAlign:"right", display:"flex", justifyContent:"flex-end" }}><Ico.Clock /></div>
        </div>
        <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:8 }} />
        {songs.map((song,i) => (
          <SongRow key={song.id} song={song} index={i} isActive={currentTrack?.id===song.id} isPlaying={isPlaying} onPlay={()=>onPlay(song,songs,i)} liked={likedSongs.includes(song.id)} onLike={()=>onLike(song.id)} />
        ))}
      </div>
    </div>
  );
}

function LikedView({ likedSongs, currentTrack, isPlaying, onPlay, onLike }) {
  const songs = SONGS.filter((s)=>likedSongs.includes(s.id));
  return (
    <div className="fade-in" style={{ paddingBottom:120 }}>
      <div style={{ padding:"48px 32px 32px", background:"linear-gradient(180deg,rgba(232,67,90,0.3) 0%,transparent 100%)", display:"flex", alignItems:"flex-end", gap:28 }}>
        <div style={{ width:180, height:180, borderRadius:4, background:"linear-gradient(135deg,#7c1a2a,#e8435a)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(0,0,0,0.5)", flexShrink:0 }}>
           <div style={{ transform: "scale(4)" }}><Ico.Heart filled={true} /></div>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#ccc", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:8 }}>Playlist</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:"#fff", marginBottom:12 }}>Liked Songs</h1>
          <div style={{ fontSize:13, color:"#aaa" }}>{songs.length} songs</div>
        </div>
      </div>
      <div style={{ padding:"0 16px" }}>
        {songs.length===0 ? (
          <div style={{ textAlign:"center", color:"#888", padding:"60px 0", fontSize:14 }}>Songs you like will appear here.</div>
        ) : songs.map((song,i) => (
          <SongRow key={song.id} song={song} index={i} isActive={currentTrack?.id===song.id} isPlaying={isPlaying} onPlay={()=>onPlay(song,songs,i)} liked onLike={()=>onLike(song.id)} />
        ))}
      </div>
    </div>
  );
}

function LibraryView({ user, userPlaylists, onSelectPlaylist, onShowAuth }) {
  const playlists = resolvePlaylists();
  return (
    <div className="fade-in" style={{ padding:"32px 32px 120px" }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:24 }}>Your Library</h1>
      {!user && (
        <div style={{ background:"#111118", borderRadius:10, padding:24, marginBottom:24, textAlign:"center" }}>
          <p style={{ color:"#aaa", fontSize:14, marginBottom:14 }}>Log in to see your library and liked songs</p>
          <button className="btn-primary" onClick={onShowAuth}>Log in</button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14 }}>
        {playlists.map((pl) => (
          <div key={pl.id} className="card" onClick={()=>onSelectPlaylist(pl)}>
            <CoverArt cover={pl.cover} size="100%" title={pl.name} radius={6} />
            <div style={{ marginTop:10, fontSize:13, fontWeight:600, color:"#f0f0f0" }}>{pl.name}</div>
            <div style={{ fontSize:11, color:"#888", marginTop:3 }}>Playlist</div>
          </div>
        ))}
        {userPlaylists?.map((pl) => (
          <div key={pl.id} className="card" onClick={()=>onSelectPlaylist(pl)}>
            <div style={{ width:"100%", paddingTop:"100%", position:"relative" }}>
              <div style={{ position:"absolute", inset:0, borderRadius:6, background:"#1a1a24", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:700 }}>M</div>
            </div>
            <div style={{ marginTop:10, fontSize:13, fontWeight:600, color:"#f0f0f0" }}>{pl.name}</div>
            <div style={{ fontSize:11, color:"#888", marginTop:3 }}>Playlist</div>
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
      if (mode==="login") { await signInWithEmailAndPassword(auth,email,pass); }
      else {
        const cred = await createUserWithEmailAndPassword(auth,email,pass);
        await updateProfile(cred.user,{displayName:name});
        await createUserDoc(cred.user.uid,{name,email});
        await sendEmailVerification(cred.user);
      }
      onClose();
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth,googleProvider);
      const exists = await getUserDoc(cred.user.uid);
      if(!exists) await createUserDoc(cred.user.uid,{name:cred.user.displayName,email:cred.user.email});
      onClose();
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:20 }}>
      <div style={{ background:"#111118", borderRadius:14, padding:"36px 32px", width:"100%", maxWidth:400, position:"relative" }}>
        <button className="icon-btn" onClick={onClose} style={{ position:"absolute", top:16, right:16 }}><Ico.X /></button>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <MusifyLogo size={44} style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize:22, fontWeight:800, color:"#fff" }}>{mode==="login"?"Log in to Musify":"Sign up for Musify"}</h2>
        </div>
        <button onClick={handleGoogle} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:500, padding:"11px 0", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", marginBottom:20, fontFamily:"inherit" }}><Ico.Google /> Continue with Google</button>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }} />
          <span style={{ color:"#888", fontSize:12 }}>or</span>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode==="signup" && <input className="input-field" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />}
          <input className="input-field" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="input-field" placeholder="Password" type="password" value={pass} onChange={(e)=>setPass(e.target.value)} />
          {err && <div style={{ color:"#e8435a", fontSize:12, padding:"8px 12px", background:"rgba(232,67,90,0.1)", borderRadius:6 }}>{err}</div>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginTop:4 }}>{loading?"...":mode==="login"?"Log In":"Sign Up"}</button>
        </div>
        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#888" }}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <button onClick={()=>setMode(mode==="login"?"signup":"login")} style={{ background:"none", border:"none", color:"#e8435a", cursor:"pointer", fontSize:13, fontWeight:700 }}>{mode==="login"?"Sign up":"Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ user, onShowAuth, onSignOut, onMenuOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ height:60, background:"rgba(10,10,15,0.85)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, borderBottom:"1px solid rgba(255,255,255,0.04)", position:"sticky", top:0, zIndex:100 }}>
      {onMenuOpen && ( <button className="icon-btn" onClick={onMenuOpen} style={{ color:"#aaa" }}><Ico.Menu /></button> )}
      <div style={{ flex:1 }} />
      {user ? (
        <div style={{ position:"relative" }}>
          <button onClick={()=>setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:500, padding:"5px 12px 5px 6px", cursor:"pointer", color:"#fff", fontFamily:"inherit", fontSize:13, fontWeight:600 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#e8435a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>{user.displayName?.[0]?.toUpperCase()||<Ico.User />}</div>
            {user.displayName?.split(" ")[0]||"Profile"}
          </button>
          {open && (
            <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"#1a1a24", borderRadius:8, padding:6, minWidth:160, boxShadow:"0 8px 24px rgba(0,0,0,0.5)", zIndex:200 }}>
              {["Log out"].map((label) => (
                <button key={label} onClick={()=>{onSignOut();setOpen(false);}} style={{ width:"100%", background:"none", border:"none", color:"#e8e8e8", padding:"9px 12px", borderRadius:4, cursor:"pointer", fontSize:14, textAlign:"left", fontFamily:"inherit" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{label}</button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn-outline" onClick={onShowAuth} style={{ padding:"7px 20px", fontSize:13 }}>Log in</button>
          <button className="btn-primary" onClick={onShowAuth} style={{ padding:"7px 20px", fontSize:13 }}>Sign up</button>
        </div>
      )}
    </div>
  );
}

function MobileNav({ view, setView }) {
  const items = [ { id:"home", label:"Home", Icon:Ico.Home }, { id:"search", label:"Search", Icon:Ico.Search }, { id:"library", label:"Library", Icon:Ico.Library } ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, height:56, background:"#0d0d14", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", zIndex:300 }}>
      {items.map(({id,label,Icon})=>(
        <button key={id} onClick={()=>setView(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer", color:view===id?"#e8435a":"#888", fontSize:10, fontWeight:600, fontFamily:"inherit", transition:"color .15s" }}>
          <Icon filled={view===id} /><span>{label}</span>
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
  const [showSettings, setShowSettings] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [pbSettings, setPbSettings] = useState({ shuffle:false, repeat:"off", crossfade:false, normalize:false, hqAudio:false, sleepTimer:0, eqPreset: "Normal", bass: 0, mid: 0, treble: 0 });
  const likedSongs = userData?.likedSongs || [];
  const userPlaylists = userData?.playlists || [];
  const handleEnded = useCallback(() => {
    if (repeat==="one") { player.seek(0); player.play(); return; }
    const next = queueIdx+1;
    if (next<queue.length) { setQueueIdx(next); setCurrentTrack(queue[next]); }
    else if (repeat==="all") { setQueueIdx(0); setCurrentTrack(queue[0]); }
    else setIsPlaying(false);
  }, [repeat,queueIdx,queue]);
  const handleManualEqChange = useCallback((b, m, t) => {
    setPbSettings(prev => ({ ...prev, bass: b, mid: m, treble: t }));
  }, []);
  const player = useAudioPlayer(handleEnded, setIsPlaying, pbSettings, handleManualEqChange);

  useEffect(() => { if(currentTrack) player.load(currentTrack.audioUrl); }, [currentTrack]);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async(u)=>{ setUser(u); if(u){const d=await getUserDoc(u.uid);setUserData(d);}else setUserData(null); });
    return unsub;
  }, []);
  useEffect(() => { if(window.location.hash==="#admin") setView("admin"); }, []);

  const playSong = useCallback((song,songList,idx)=>{
    const list = shuffle ? [...songList].sort(()=>Math.random()-.5) : songList;
    const newIdx = shuffle ? list.findIndex((s)=>s.id===song.id) : idx;
    setQueue(list); setQueueIdx(newIdx>=0?newIdx:0); setCurrentTrack(song);
  },[shuffle]);
  const togglePlay = () => { if(isPlaying) player.pause(); else player.play(); };
  const goNext = () => { const n=queueIdx+1; if(n<queue.length){setQueueIdx(n);setCurrentTrack(queue[n]);}else if(repeat==="all"){setQueueIdx(0);setCurrentTrack(queue[0]);} };
  const goPrev = () => { if(player.progress>3){player.seek(0);return;} const p=queueIdx-1; if(p>=0){setQueueIdx(p);setCurrentTrack(queue[p]);} };
  const toggleLike = async(songId)=>{ if(!user){setShowAuth(true);return;} const updated=likedSongs.includes(songId)?likedSongs.filter((id)=>id!==songId):[...likedSongs,songId]; setUserData((prev)=>({...prev,likedSongs:updated})); await saveUserLiked(user.uid,updated); };
  
  const handleCreatePlaylist = async()=>{ if(!user){setShowAuth(true);return;} const name=prompt("Playlist name:"); if(!name)return; const pl={id:generateId(),name,songs:[],songIds:[]}; setUserData((prev)=>({...prev,playlists:[...(prev?.playlists||[]),pl]})); await saveUserPlaylist(user.uid,pl); };
  const handleSelectPlaylist = (pl)=>{ setSelectedPlaylist(pl); setView("playlist"); };
  const handleSignOut = async()=>{ await signOut(auth); setUser(null); setUserData(null); };
  const handlePbChange = (key,val)=>{ setPbSettings(prev=>({...prev,[key]:val})); if(key==="shuffle") setShuffle(val); if(key==="repeat") setRepeat(val); };
  const renderMain = () => {
    if(view==="admin") return <AdminPanel />;
    if(view==="playlist"&&selectedPlaylist) return <PlaylistView playlist={selectedPlaylist} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playSong} likedSongs={likedSongs} onLike={toggleLike} />;
    if(view==="liked") return <LikedView likedSongs={likedSongs} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playSong} onLike={toggleLike} />;
    if(view==="search") return <SearchView currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playSong} likedSongs={likedSongs} onLike={toggleLike} />;
    if(view==="library") return <LibraryView user={user} userPlaylists={userPlaylists} onSelectPlaylist={handleSelectPlaylist} onShowAuth={()=>setShowAuth(true)} />;
    return <HomeView user={user} onSelectPlaylist={handleSelectPlaylist} currentTrack={currentTrack} onPlay={playSong} isPlaying={isPlaying} likedSongs={likedSongs} onLike={toggleLike} />;
  };
  return (
    <>
      <GlobalStyles />
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        {!isMobile && (
          <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
            <Sidebar view={view} setView={setView} user={user} userPlaylists={userPlaylists} onCreatePlaylist={handleCreatePlaylist} onSelectPlaylist={handleSelectPlaylist} onSignOut={handleSignOut} onOpenSettings={()=>setShowSettings(true)} />
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <TopBar user={user} onShowAuth={()=>setShowAuth(true)} onSignOut={handleSignOut} />
              <div style={{ flex:1, overflowY:"auto" }}>{renderMain()}</div>
            </div>
          </div>
        )}
        {isMobile && (
          <div style={{ flex:1, overflowY:"auto", paddingTop:8 }}>
            <div style={{ padding:"12px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button className="icon-btn" onClick={()=>setMobileSidebar(true)} style={{ color:"#fff" }}><Ico.Menu /></button>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <MusifyLogo size={26} />
                <span style={{ fontWeight:800, fontSize:18, color:"#fff" }}>Musify</span>
              </div>
              {user ? ( <div style={{ width:32, height:32, borderRadius:"50%", background:"#e8435a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>{user.displayName?.[0]?.toUpperCase()||"U"}</div> ) : ( <button className="btn-primary" onClick={()=>setShowAuth(true)} style={{ padding:"6px 14px", fontSize:12 }}>Log in</button> )}
            </div>
            {renderMain()}
          </div>
        )}
      </div>

      <PlayerBar track={currentTrack} isPlaying={isPlaying} onToggle={togglePlay} progress={player.progress} duration={player.duration} onSeek={player.seek} onNext={goNext} onPrev={goPrev} volume={player.volume} onVolume={player.setVol} liked={currentTrack?likedSongs.includes(currentTrack.id):false} onLike={()=>currentTrack&&toggleLike(currentTrack.id)} isMobile={isMobile} shuffle={shuffle} repeat={repeat} onShuffleToggle={()=>setShuffle(s=>!s)} onRepeatToggle={()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off")} onExpand={() => setFullPlayerOpen(true)} />
      {isMobile && fullPlayerOpen && ( <FullScreenPlayer track={currentTrack} isPlaying={isPlaying} onToggle={togglePlay} progress={player.progress} duration={player.duration} onSeek={player.seek} onNext={goNext} onPrev={goPrev} shuffle={shuffle} repeat={repeat} onShuffleToggle={()=>setShuffle(s=>!s)} onRepeatToggle={()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off")} liked={currentTrack?likedSongs.includes(currentTrack.id):false} onLike={()=>currentTrack&&toggleLike(currentTrack.id)} onClose={() => setFullPlayerOpen(false)} onOpenSettings={() => setShowSettings(true)} /> )}
      {isMobile && <MobileNav view={view} setView={setView} />}
      <MobileSidebar open={mobileSidebar} onClose={()=>setMobileSidebar(false)} view={view} setView={setView} user={user} userPlaylists={userPlaylists} onCreatePlaylist={handleCreatePlaylist} onSelectPlaylist={handleSelectPlaylist} onShowAuth={()=>setShowAuth(true)} onSignOut={handleSignOut} onOpenSettings={()=>setShowSettings(true)} />
      {showSettings && ( <PlaybackSettings settings={pbSettings} onChange={handlePbChange} onSleepTimer={player.setSleepTimer} onClose={()=>setShowSettings(false)} /> )}
      {showAuth && <AuthView onClose={()=>setShowAuth(false)} />}
    </>
  );
}
