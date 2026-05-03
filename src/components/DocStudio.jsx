import React, { useState, useRef } from "react";
import { renderAsync } from "docx-preview";
import html2pdf from "html2pdf.js";

const DocStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const renderRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const processToPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStatus("Membaca dokumen...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileNameNoExt = file.name.split(".")[0];

      // 1. Bersihkan area render
      renderRef.current.innerHTML = "";

      // 2. Render DOCX ke HTML secara visual (Presisi Tinggi)
      setStatus("Menyusun layout & grafik...");
      await renderAsync(arrayBuffer, renderRef.current, null, {
        ignoreLastRenderedPageBreak: false, // Penting agar pemisah halaman tetap ada
        usePredefinedStyles: true,
      });

      // 3. TUNGGU VALIDASI VISUAL (Kunci agar tidak Kosong)
      // Kita menunggu sampai semua elemen gambar/grafik benar-benar terlukis oleh browser
      await new Promise((resolve) => {
        let checkCount = 0;
        const interval = setInterval(() => {
          const imgs = renderRef.current.querySelectorAll("img");
          const allLoaded = Array.from(imgs).every(
            (img) => img.complete && img.naturalWidth > 0,
          );
          checkCount++;

          // Jika semua gambar OK atau sudah menunggu 4 detik
          if (allLoaded || checkCount > 20) {
            clearInterval(interval);
            resolve();
          }
        }, 200);
      });

      // Jeda ekstra untuk stabilitas font
      await new Promise((r) => setTimeout(r, 1000));
      setStatus("Mengambil snapshot per halaman...");

      // 4. KONFIGURASI SNAPSHOT (Ubah HTML jadi PNG di dalam PDF)
      const opt = {
        margin: [10, 10, 10, 10], // Margin atas, kiri, bawah, kanan (mm)
        filename: `${fileNameNoExt}.pdf`,
        image: { type: "jpeg", quality: 0.98 }, // Menggunakan format gambar kualitas tinggi
        html2canvas: {
          scale: 2, // Resolusi HD (teks tidak pecah)
          useCORS: true, // Dukung gambar dari luar
          letterRendering: true,
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        // Mode ini memotong halaman berdasarkan visual, bukan kode (Sangat Akurat)
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Jalankan proses 'Printing'
      await html2pdf().set(opt).from(renderRef.current).save();
      setStatus("Selesai!");
    } catch (err) {
      console.error(err);
      alert("Gagal mengonversi. Pastikan file tidak rusak.");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setStatus("");
        if (renderRef.current) renderRef.current.innerHTML = "";
      }, 2000);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Kembali
      </button>
      <h2 style={styles.title}>DocStudio Pro 📄</h2>

      <div style={styles.card}>
        {isProcessing && (
          <div style={styles.overlay}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{status}</p>
          </div>
        )}

        {!file ? (
          <div style={styles.dropzone}>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            <p style={styles.dropText}>Pilih File .DOCX</p>
            <p
              style={{ fontSize: "11px", color: "#71b280", marginTop: "10px" }}
            >
              Layout, Grafik RStudio, & Tabel akan terjaga.
            </p>
          </div>
        ) : (
          <div style={styles.controls}>
            <p style={styles.fileName}>📄 {file.name}</p>
            <button onClick={processToPdf} style={styles.actionBtn}>
              DOWNLOAD PDF (PRESISI)
            </button>
            <button onClick={() => setFile(null)} style={styles.changeBtn}>
              Ganti File
            </button>
          </div>
        )}
      </div>

      {/* AREA RENDER HIDDEN (Wajib ada di DOM agar bisa dipotret) */}
      <div
        ref={renderRef}
        style={{
          position: "absolute",
          top: "10000px", // Jauh di bawah halaman agar tidak mengganggu UI
          left: "0",
          width: "210mm",
          background: "white",
          color: "black",
          padding: "15mm",
          minHeight: "297mm",
        }}
      />

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ... Gaya (Styles) tetap seperti versi sebelumnya ...
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
    color: "white",
  },
  title: { color: "#f9d423", marginBottom: "20px", fontWeight: "900" },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "30px",
    borderRadius: "25px",
    border: "1px solid #40798c",
    position: "relative",
    width: "100%",
    maxWidth: "400px",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(11,32,39,0.98)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "25px",
    zIndex: 10,
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f9d423",
    borderTop: "4px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: { color: "#f9d423", marginTop: "15px", fontWeight: "bold" },
  dropzone: {
    border: "2px dashed #40798c",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    position: "relative",
  },
  fileInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
    top: 0,
    left: 0,
  },
  dropText: { color: "#afeeee", fontWeight: "bold" },
  fileName: {
    color: "#71b280",
    marginBottom: "20px",
    textAlign: "center",
    fontWeight: "bold",
    wordBreak: "break-all",
  },
  actionBtn: {
    width: "100%",
    padding: "16px",
    background: "#f9d423",
    color: "#0b2027",
    border: "none",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },
  changeBtn: {
    background: "none",
    border: "none",
    color: "#ff6b6b",
    marginTop: "15px",
    cursor: "pointer",
    textDecoration: "underline",
    width: "100%",
  },
  backBtn: {
    alignSelf: "flex-start",
    background: "none",
    border: "1px solid #71b280",
    color: "#71b280",
    padding: "8px 15px",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "20px",
  },
};

export default DocStudio;
