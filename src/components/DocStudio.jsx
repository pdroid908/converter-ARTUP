import React, { useState } from "react";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";

const DocStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [dynamicOptions, setDynamicOptions] = useState([]);
  // FUNGSI PENGAMAN: Membersihkan karakter script jahat
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

    // 1. CEK UKURAN (Maksimal 10MB agar browser tidak crash/pingsan)
    if (selected.size > 10 * 1024 * 1024) {
      alert("File terlalu berat! Maksimal 10MB agar sistem tidak pingsan.");
      e.target.value = "";
      return;
    }

    // 2. CEK MIME TYPE (Hanya terima Dokumen & Teks asli)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(selected.type)) {
      alert("Karakter file mencurigakan! ARTUP hanya menerima dokumen resmi.");
      e.target.value = "";
      return;
    }

    setFile(selected);
    const fileName = selected.name.toLowerCase();

    // Logika Smart Dropdown tetap sama
    let options = [];
    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      options = [
        { value: "pdf", label: "PDF Document (.pdf)" },
        { value: "txt", label: "Plain Text (.txt)" },
        { value: "html", label: "Web Page (.html)" },
      ];
    } else if (fileName.endsWith(".pdf")) {
      options = [{ value: "txt", label: "Plain Text (.txt)" }];
    } else {
      options = [{ value: "pdf", label: "PDF Document (.pdf)" }];
    }
    setDynamicOptions(options);
    setOutputFormat(options[0].value);
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileNameNoExt = file.name.split(".")[0];

        // Ambil teks dari file
        let rawText = "";
        if (file.name.toLowerCase().endsWith(".docx")) {
          const result = await mammoth.extractRawText({ arrayBuffer });
          rawText = result.value;
        } else {
          rawText = await file.text();
        }

        // SANITASI: Bersihkan teks dari potensi script jahat
        const safeText = sanitizeText(rawText);

        if (outputFormat === "pdf") {
          const pdf = new jsPDF();
          const lines = pdf.splitTextToSize(rawText, 180); // PDF jsPDF aman secara default
          pdf.text(lines, 10, 10);
          pdf.save(`${fileNameNoExt}.pdf`);
        } else if (outputFormat === "html") {
          // Masukkan teks yang sudah di-sanitize ke dalam template HTML
          const simpleHtml = `<html><body style="font-family:sans-serif; padding:20px;"><pre>${safeText}</pre></body></html>`;
          downloadBlob(simpleHtml, `${fileNameNoExt}.html`, "text/html");
        } else if (outputFormat === "txt") {
          downloadBlob(safeText, `${fileNameNoExt}.txt`, "text/plain");
        }
      } catch (err) {
        console.error(err);
        alert("Gagal meracik: File rusak atau tidak terbaca.");
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
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
      <h2 style={{ color: "#f9d423" }}>Document Converter 📄</h2>

      <div style={styles.card}>
        {/* Spinner Loading */}
        {isProcessing && (
          <div style={styles.overlay}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: "10px", color: "#f9d423" }}>
              Sedang Meracik File...
            </p>
          </div>
        )}

        <div style={{ ...styles.dropzone, opacity: isProcessing ? 0.3 : 1 }}>
          <input
            type="file"
            onChange={handleFileChange}
            style={styles.fileInput}
            disabled={isProcessing}
          />
          <p style={{ color: "#afeeee" }}>
            {file
              ? `Terpilih: ${file.name}`
              : "Klik untuk pilih Dokumen apapun "}
          </p>
        </div>

        {file && !isProcessing && (
          <div style={styles.controls}>
            <div style={styles.row}>
              <label>Convert ke : </label>
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
            <button onClick={processFile} style={styles.actionBtn}>
              Mulai Konversi
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
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
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid #40798c",
    textAlign: "center",
    width: "100%",
    maxWidth: "450px",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(11, 32, 39, 0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: "20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f9d423",
    borderTop: "4px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  dropzone: {
    border: "2px dashed #40798c",
    padding: "40px",
    borderRadius: "15px",
    position: "relative",
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
  controls: { marginTop: "25px", textAlign: "left" },
  row: {
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "white",
  },
  input: {
    padding: "8px",
    borderRadius: "8px",
    background: "#0b2027",
    color: "white",
    border: "1px solid #40798c",
  },
  actionBtn: {
    background: "#f9d423",
    color: "#0b2027",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
};

export default DocStudio;
