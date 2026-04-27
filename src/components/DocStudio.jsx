import React, { useState } from "react";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";

const DocStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [dynamicOptions, setDynamicOptions] = useState([]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    const fileName = selected.name.toLowerCase();

    // Logika Smart Dropdown
    let options = [];
    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      options = [
        { value: "pdf", label: "PDF Document (.pdf)" },
        { value: "txt", label: "Plain Text (.txt)" },
        { value: "html", label: "Web Page (.html)" },
        { value: "png", label: "Convert ke Gambar (.png)" },
      ];
    } else if (fileName.endsWith(".pdf")) {
      options = [
        { value: "docx", label: "Word Document (.docx)" },
        { value: "txt", label: "Plain Text (.txt)" },
        { value: "png", label: "Convert ke Gambar (.png)" },
      ];
    } else {
      options = [
        { value: "pdf", label: "PDF Document (.pdf)" },
        { value: "png", label: "Convert ke Gambar (.png)" },
      ];
    }
    setDynamicOptions(options);
    setOutputFormat(options[0].value);
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    // Gunakan timeout agar animasi spinner sempat muncul
    setTimeout(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileNameNoExt = file.name.split(".")[0];

        if (outputFormat === "pdf") {
          const pdf = new jsPDF();
          let text = "";
          if (file.name.toLowerCase().endsWith(".docx")) {
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
          } else {
            text = await file.text();
          }
          const lines = pdf.splitTextToSize(text, 180);
          pdf.text(lines, 10, 10);
          pdf.save(`${fileNameNoExt}.pdf`);
        } else if (outputFormat === "html") {
          // PERBAIKAN: Konversi ke HTML untuk file Word
          if (file.name.toLowerCase().endsWith(".docx")) {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            downloadBlob(result.value, `${fileNameNoExt}.html`, "text/html");
          } else {
            const text = await file.text();
            const simpleHtml = `<html><body><pre>${text}</pre></body></html>`;
            downloadBlob(simpleHtml, `${fileNameNoExt}.html`, "text/html");
          }
        } else if (outputFormat === "png") {
          // INFO: Render PNG murni di browser butuh pdf.js
          alert(
            "Gunakan 'Image Studio' untuk konversi gambar. Fitur render dokumen ke foto sedang diintegrasikan.",
          );
        } else if (outputFormat === "txt" || outputFormat === "docx") {
          let text = "";
          if (file.name.toLowerCase().endsWith(".docx")) {
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
          } else {
            text = await file.text();
          }
          downloadBlob(text, `${fileNameNoExt}.${outputFormat}`, "text/plain");
        }
      } catch (err) {
        alert("Gagal memproses file.");
      } finally {
        setIsProcessing(false); // Memastikan animasi loading hilang
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
};

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
