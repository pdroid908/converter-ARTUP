import React, { useState } from "react";
import ImageStudio from "./components/ImageStudio";
import DocStudio from "./components/DocStudio";

const MenuUtama = ({ setMode }) => (
  <div style={styles.container}>
    {/* Header dengan Logo Biru */}
    <div style={styles.headerSection}>
      <div style={styles.logoCircle}>
        <span style={{ fontSize: "24px" }}>🔵</span>
      </div>
      <h1 style={styles.title}>
        <span>ARTUP</span>
        <span
          style={{
            color: "#ffffff",
            fontWeight: "400",
            fontStyle: "normal",
            textTransform: "none",
            letterSpacing: "normal",
            marginLeft: "10px",
            fontSize: "0.6em", // Ukuran teks converter dibuat sedikit lebih kecil dari ARTUP
            display: "inline-block",
          }}
        >
          Converter
        </span>
      </h1>
    </div>

    <div style={styles.heroSection}>
      <p style={styles.mainSubtitle}>
        PRIVASI anda  aman, tidak ada data yang di kirim
      </p>
      <p style={styles.description}>
        Semua proses konversi terjadi di dalam
        perangkatmu sendiri, dan selesai tanpa jejak.
      </p>
    </div>

    {/* Perbandingan Horizontal (Lebih Rapi & Simetris) */}
    <div style={styles.comparisonGrid}>
      <div style={styles.comparisonCardBad}>
        <span style={styles.badIcon}>❌</span>
        <p style={styles.compText}>
          <b>Converter Lain:</b> File dikirim di belakang layar, diintip server, dan
          rawan bocor.
        </p>
      </div>

      <div style={styles.comparisonCardGood}>
        <span style={styles.goodIcon}>✅</span>
        <p style={styles.compText}>
          <b>ARTUP:</b> 100% eksekusi di tempat. File tidak pernah meninggalkan
          browsermu.
        </p>
      </div>
    </div>

    {/* Menu Utama */}
    <div style={styles.menuGrid}>
      <div style={styles.card} onClick={() => setMode("image")}>
        <div style={styles.icon}>🖼️</div>
        <h2 style={styles.cardTitle}>Image Studio</h2>
        <p style={styles.cardDesc}>PNG, JPG, WebP & Pixel Art Upscale</p>
      </div>

      <div style={styles.card} onClick={() => setMode("doc")}>
        <div style={styles.icon}>📄</div>
        <h2 style={styles.cardTitle}>Document Studio</h2>
        <p style={styles.cardDesc}>Word, PDF, Text & Image Conversion</p>
      </div>
    </div>
  </div>
);

export default function App() {
  const [mode, setMode] = useState("menu");

  return (
    <div style={{ backgroundColor: "#0b2027", minHeight: "100vh" }}>
      {mode === "menu" && <MenuUtama setMode={setMode} />}
      {mode === "image" && <ImageStudio onBack={() => setMode("menu")} />}
      {mode === "doc" && <DocStudio onBack={() => setMode("menu")} />}
    </div>
  );
}

const styles = {
  // --- Global ---
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    fontFamily: "sans-serif",
  },

  // --- Header & Logo ---
  headerSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // Agar rata tengah di HP
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap", // Agar icon dan teks bisa bertumpuk jika layar sangat sempit
    width: "100%",
  },
  logoCircle: {
    // Gunakan minWidth dan minHeight agar bulatannya tidak gepeng saat layar sempit
    minWidth: "40px",
    minHeight: "40px",
    width: "clamp(40px, 10vw, 50px)",
    height: "clamp(40px, 10vw, 50px)",
    borderRadius: "50%",
    background: "rgba(58, 134, 255, 0.1)",
    border: "2px solid #3a86ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0, // KUNCI: Agar icon tidak gepeng/tertekan tulisan
  },
  logoIcon: { fontSize: "24px" },
  title: {
    // Menggunakan clamp agar minimal 1.8rem dan maksimal 3rem sesuai lebar layar
    fontSize: "clamp(1.8rem, 8vw, 3rem)",
    fontWeight: "900",
    color: "#3b82f6",
    fontStyle: "italic",
    letterSpacing: "-0.05em",
    textTransform: "uppercase",
    margin: 0,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap", // Agar tulisan "Converter" bisa turun ke bawah jika tidak muat
    justifyContent: "center",
    textAlign: "center",
  },

  // --- Subtitle Emosional ---
  heroSection: { marginBottom: "35px", textAlign: "center" },
  mainSubtitle: {
    fontSize: "1.2rem",
    color: "#71b280",
    fontWeight: "500",
    fontStyle: "italic",
    margin: 0,
    opacity: 0.9,
  },

  // --- Comparison Cards (Gaya disamakan dengan kartu menu) ---
  comparisonGrid: {
    display: "flex",
    gap: "20px",
    marginBottom: "45px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: "750px",
  },
  compText: {
    fontSize: "0.9rem",
    color: "#afeeee",
    lineHeight: "1.5",
    margin: 0,
  },

  // Gaya Kartu  (Lebih redup/abu-abu)
  comparisonCardBad: {
    flex: "1 1 300px",
    display: "flex",
    alignItems: "start",
    gap: "15px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "15px",
    padding: "15px 20px",
  },
  statusIconBad: { fontSize: "1.2rem", opacity: 0.5, marginTop: "3px" },

  // Gaya Kartu "Bagus" (Pakai warna biru aksen kamu)
  comparisonCardGood: {
    flex: "1 1 300px",
    display: "flex",
    alignItems: "start",
    gap: "15px",
    background: "rgba(58, 134, 255, 0.05)",
    border: "1px solid #3a86ff",
    borderRadius: "15px",
    padding: "15px 20px",
    boxShadow: "0 0 15px rgba(58, 134, 255, 0.1)",
  },
  statusIconGood: { fontSize: "1.2rem", color: "#3a86ff", marginTop: "3px" },

  // --- Menu Grid (Tetap seperti aslinya) ---
  menuGrid: {
    display: "flex",
    gap: "25px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid #40798c",
    borderRadius: "20px",
    padding: "40px",
    width: "280px",
    cursor: "pointer",
    textAlign: "center",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    // Tambahkan flex agar posisi icon dan teks lebih rapi
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  title: {
    fontSize: "3rem", // Ukuran tetap besar agar dominan
    fontWeight: "900", // font-black
    color: "#3b82f6", // text-blue-500 (Biru Brand)
    fontStyle: "italic", // italic
    letterSpacing: "-0.05em", // tracking-tighter
    textTransform: "uppercase", // uppercase
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  icon: {
    fontSize: "80px", // Ukuran icon diperbesar dari standar
    marginBottom: "20px",
    display: "block",
    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.1))", // Tambah sedikit efek glow
  },

  cardTitle: {
    fontSize: "1.5rem",
    color: "#ffffff",
    marginBottom: "10px",
    marginTop: "0",
  },

  cardDesc: {
    fontSize: "0.9rem",
    color: "#afeeee",
    margin: 0,
    opacity: 0.8,
  },
  // ... style lainnya ...
};
