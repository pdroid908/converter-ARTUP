import React, { useState } from "react";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";

const DocStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [quality, setQuality] = useState(0.8);

  const sanitizeText = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      alert("File terlalu berat! Maksimal 10MB kasian perangkat mu.");
      return;
    }

    setFile(selected);
    const fileName = selected.name.toLowerCase();

    let options = [];
    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      options = [
        { value: "pdf", label: "PDF (.pdf)" },
        { value: "txt", label: "Teks (.txt)" },
        { value: "html", label: "Web (.html)" },
      ];
    } else if (fileName.endsWith(".pdf")) {
      options = [{ value: "txt", label: "Teks Polos (.txt)" }];
    } else {
      options = [
        { value: "pdf", label: "PDF (.pdf)" },
        { value: "html", label: "Web (.html)" },
      ];
    }
    setDynamicOptions(options);
    setOutputFormat(options[0].value);
  };

  const getDocEstimateSize = () => {
    if (!file) return "0 KB";
    let formatMultiplier = 1;
    if (outputFormat === "pdf") formatMultiplier = 1.1;
    if (outputFormat === "txt") formatMultiplier = 0.3;
    if (outputFormat === "html") formatMultiplier = 0.5;

    const estimatedBytes = file.size * quality * formatMultiplier;
    return estimatedBytes > 1024 * 1024
      ? (estimatedBytes / (1024 * 1024)).toFixed(2) + " MB"
      : (estimatedBytes / 1024).toFixed(0) + " KB";
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileNameNoExt = file.name.split(".")[0];
        let rawText = "";

        if (file.name.toLowerCase().endsWith(".docx")) {
          const result = await mammoth.extractRawText({ arrayBuffer });
          rawText = result.value;
        } else {
          rawText = await file.text();
        }

        if (outputFormat === "pdf") {
          const pdf = new jsPDF({ compress: quality < 0.6 });
          pdf.setFontSize(9 + quality * 3);
          const lines = pdf.splitTextToSize(rawText, 180);
          pdf.text(lines, 10, 10);
          pdf.save(`${fileNameNoExt}.pdf`);
        } else if (outputFormat === "html") {
          const safeText = sanitizeText(rawText);
          const simpleHtml = `<html><body style="font-family:sans-serif; padding:20px;"><pre style="white-space:pre-wrap;">${safeText}</pre></body></html>`;
          downloadBlob(simpleHtml, `${fileNameNoExt}.html`, "text/html");
        } else if (outputFormat === "txt") {
          downloadBlob(rawText, `${fileNameNoExt}.txt`, "text/plain");
        }
      } catch (err) {
        alert("Gagal memproses dokumen.");
      } finally {
        setIsProcessing(false);
      }
    }, 1200);
  };

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Kembali
      </button>
      <h2 style={styles.title}>Document Studio 📄</h2>

      <div style={styles.card}>
        {isProcessing && (
          <div style={styles.overlay}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Sedang Mengonversi...</p>
          </div>
        )}

        {!file ? (
          <div style={styles.dropzone}>
            <input
              type="file"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            <p style={styles.dropText}>Klik untuk pilih dokumen</p>
            <div style={styles.formatInfo}>
              <p style={styles.formatLabel}>Format didukung:</p>
              <p style={styles.formatList}>.DOCX .PDF .TXT .DOC</p>
            </div>
          </div>
        ) : (
          <div style={styles.fileSelected}>
            <p style={styles.fileName}>📄 {file.name}</p>
            <button onClick={() => setFile(null)} style={styles.changeBtn}>
              Ganti File
            </button>
          </div>
        )}

        {file && !isProcessing && (
          <div style={styles.controls}>
            <div style={styles.infoBox}>
              <p>
                Asli: <b>{(file.size / 1024).toFixed(0)} KB</b>
              </p>
              <p style={{ color: "#f9d423" }}>
                Hasil: <b>{getDocEstimateSize()}</b>
              </p>
            </div>

            <div style={styles.row}>
              <label>Convert ke:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                style={styles.input}
              >
                {dynamicOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.row}>
              <label>Ukuran ({Math.round(quality * 100)}%):</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={styles.slider}
              />
            </div>

            <button onClick={processFile} style={styles.actionBtn}>
              KONVERSI SEKARANG ✅
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box", // PENTING: Agar padding tidak bocor
    overflowX: "hidden", // PENTING: Agar tidak ada layar putih di kanan
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
  title: {
    color: "#f9d423",
    textAlign: "center",
    marginBottom: "25px",
    fontSize: "1.5rem",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px", // Padding dikurangi buat HP
    borderRadius: "25px",
    border: "1px solid #40798c",
    width: "100%",
    maxWidth: "480px",
    position: "relative",
    backdropFilter: "blur(10px)",
    boxSizing: "border-box",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(11, 32, 39, 0.95)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: "25px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f9d423",
    borderTop: "4px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: { marginTop: "15px", color: "#f9d423", fontWeight: "bold" },
  dropzone: {
    border: "2px dashed #40798c",
    padding: "30px 10px", // Disesuaikan lebar HP
    borderRadius: "20px",
    position: "relative",
    textAlign: "center",
    background: "rgba(255,255,255,0.01)",
  },
  fileInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    opacity: 0,
    cursor: "pointer",
  },
  dropText: { color: "#afeeee", fontWeight: "bold", fontSize: "1rem" },
  formatInfo: {
    marginTop: "15px",
    borderTop: "1px solid rgba(175, 238, 238, 0.2)",
    paddingTop: "10px",
  },
  formatLabel: { color: "rgba(175, 238, 238, 0.6)", fontSize: "0.75rem" },
  formatList: { color: "#f9d423", fontSize: "0.85rem", fontWeight: "bold" },
  fileSelected: {
    marginBottom: "20px",
    background: "rgba(0,0,0,0.3)",
    padding: "12px",
    borderRadius: "15px",
  },
  fileName: { color: "#71b280", fontWeight: "bold", wordBreak: "break-all" }, // Agar nama file panjang tidak tembus
  changeBtn: {
    background: "none",
    border: "none",
    color: "#ff6b6b",
    cursor: "pointer",
    fontSize: "0.8rem",
    textDecoration: "underline",
  },
  controls: { textAlign: "left", width: "100%" },
  infoBox: {
    background: "rgba(0,0,0,0.4)",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "15px",
    fontSize: "0.85rem",
    color: "#afeeee",
  },
  row: {
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "white",
    flexWrap: "wrap",
    gap: "10px",
  },
  input: {
    padding: "8px",
    borderRadius: "10px",
    background: "#0b2027",
    color: "white",
    border: "1px solid #40798c",
  },
  slider: { flex: 1, minWidth: "100px", cursor: "pointer" },
  actionBtn: {
    background: "#f9d423",
    color: "#0b2027",
    border: "none",
    padding: "15px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
    width: "100%",
    fontSize: "0.9rem",
  },
};

export default DocStudio;
