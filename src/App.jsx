import React, { useState } from "react";
import ImageStudio from "./components/ImageStudio";
import { Analytics } from "@vercel/analytics/react";
import "./App.css"; // Pastikan CSS diimport
import AudioStudio from "./components/AudioStudio";
import VideoStudio from "./components/VideoStudio";


// Tambahkan daftar web kamu di sini agar mudah dikelola
const MY_PROJECTS = [
  {
    name: "Link Scanner",
    icon: "🛡️",
    url: "https://artup-studio.vercel.app/Security",
    desc: "Scan & Protect Website",
  },
  {
    name: "Mini game",
    icon: "🎬",
    url: "https://artup-studio.vercel.app/",
    desc: "for fun",
  },
];

const MenuUtama = ({ setMode }) => (
  <div className="main-container">
    {/* Header Section */}
    <div className="header-section">
      <div className="logo-wrapper">
        <div className="logo-circle">
          <span style={{ fontSize: "24px" }}>🔵</span>
        </div>
        <h1 className="brand-title">
          ARTUP<span className="brand-subtitle">Converter</span>
        </h1>
      </div>

      <p
        style={{
          color: "#71b280",
          fontWeight: "500",
          fontStyle: "italic",
          margin: "10px 0 5px",
        }}
      >
        PRIVASI anda aman, tidak ada data yang dikirim
      </p>
      <p
        style={{
          opacity: 0.7,
          fontSize: "0.9rem",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        Semua proses konversi terjadi di dalam perangkatmu sendiri, dan selesai
        tanpa jejak.
      </p>
    </div>

    {/* Comparison Grid */}
    <div className="comparison-grid">
      <div className="comp-card bad">
        <span>❌</span>
        <p className="comp-text">
          <b>Converter Lain:</b> File dikirim ke server, diintip, dan berisiko
          bocor.
        </p>
      </div>

      <div className="comp-card good">
        <span>✅</span>
        <p className="comp-text">
          <b>ARTUP:</b> 100% eksekusi lokal. File tidak pernah meninggalkan
          browsermu.
        </p>
      </div>
    </div>

    {/* Menu Utama Grid */}
    <div className="menu-grid">
      <div className="menu-card" onClick={() => setMode("image")}>
        <span className="icon">🖼️</span>
        <h2 style={{ color: "white", margin: "0 0 10px" }}>Image Studio</h2>
        <p style={{ color: "#afeeee", opacity: 0.8, fontSize: "0.9rem" }}>
          PNG, JPG, WebP & Pixel Art Upscale
        </p>
      </div>

      {/* Audio Studio Card (Baru) */}
      <div className="menu-card" onClick={() => setMode("audio")}>
        <span className="icon">🎵</span>
        <h2 style={{ color: "white", margin: "0 0 10px" }}>Audio Studio</h2>
        <p style={{ color: "#afeeee", opacity: 0.8, fontSize: "0.9rem" }}>
          Ekstrak Audio dari Video (MP4 to WAV/mp3)
        </p>
      </div>

      {/* Audio Studio Card (Baru) */}
      <div className="menu-card" onClick={() => setMode("video")}>
        <span className="icon">🎬</span>
        <h2 style={{ color: "white", margin: "0 0 10px" }}>Video Studio</h2>
        <p style={{ color: "#afeeee", opacity: 0.8, fontSize: "0.9rem" }}>
          Resize ukuran video offline no data
        </p>
      </div>
    </div>
  </div>
);



export default function App() {
  const [mode, setMode] = useState("menu");

  return (
    <div
      style={{
        backgroundColor: "#0b2027",
        minHeight: "100vh",
        position: "relative",
        paddingBottom: "100px",
      }}
    >
      <Analytics />

      {/* Floating Dock: Selalu Muncul */}
      <div className="floating-dock">
        <div className="dock-container glass-effect">
          <p className="dock-tag">ARTUP Ecosystem:</p>
          <div className="dock-grid">
            {MY_PROJECTS.map((project, index) => (
              <a
                key={index}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dock-card"
                title={project.desc} // Muncul saat kursor didiamkan
              >
                <span className="dock-icon">{project.icon}</span>
                <span className="dock-name">{project.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {mode === "menu" && <MenuUtama setMode={setMode} />}
      {mode === "image" && <ImageStudio onBack={() => setMode("menu")} />}
      {mode === "audio" && <AudioStudio onBack={() => setMode("menu")} />}
      {mode === "video" && <VideoStudio onBack={() => setMode("menu")} />}
    </div>
  );
}
