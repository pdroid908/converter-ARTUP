import React, { useState, useRef, useEffect } from "react";

const ImageStudio = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [format, setFormat] = useState("image/png");
  const [upscale, setUpscale] = useState(1);
  const [fileInfo, setFileInfo] = useState({ size: 0, width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Ambil dimensi asli gambar
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setFileInfo({
          size: file.size,
          width: img.width,
          height: img.height,
        });
      };
    }
  };

  // Fungsi menghitung estimasi ukuran (dalam MB)
  const getEstimateSize = () => {
    if (!fileInfo.size) return "0 MB";

    // Logika kasar: Luas area (skala^2) dikali pengali format
    const multiplier =
      format === "image/jpeg" ? 0.7 : format === "image/webp" ? 0.5 : 1.2;
    const estimatedBytes = fileInfo.size * (upscale * upscale) * multiplier;
    const mb = estimatedBytes / (1024 * 1024);

    return mb.toFixed(2) + " MB";
  };

  const processAndDownload = () => {
    setIsLoading(true);

    // Beri sedikit delay agar loading terlihat (dan memberi nafas buat browser)
    setTimeout(() => {
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = img.width * upscale;
        canvas.height = img.height * upscale;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const link = document.createElement("a");
        link.download = `artup-${Date.now()}.${format.split("/")[1]}`;
        link.href = canvas.toDataURL(format, 0.9);
        link.click();

        setIsLoading(false);
      };
    }, 500);
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Kembali
      </button>
      <h2 style={{ color: "#f9d423" }}>Image Converter 📸</h2>

      <div style={styles.dropzone}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <p style={{ color: "#afeeee" }}>Pilih foto format apapun</p>
      </div>

      {previewUrl && (
        <div style={styles.controls}>
          <img src={previewUrl} alt="Preview" style={styles.preview} />

          {/* INFO UKURAN */}
          <div style={styles.infoBox}>
            <p>
              Ukuran Asli:{" "}
              <b>{(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</b>
            </p>
            <p>
              Estimasi Hasil:{" "}
              <b style={{ color: "#f9d423" }}>{getEstimateSize()}</b>
            </p>
            <p>
              Dimensi: {fileInfo.width * upscale} x {fileInfo.height * upscale}{" "}
              px
            </p>
          </div>

          <div style={styles.row}>
            <label>Convert ke:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={styles.input}
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG </option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <div style={styles.row}>
            <label>skala:</label>
            <select
              value={upscale}
              onChange={(e) => setUpscale(Number(e.target.value))}
              style={styles.input}
            >
              <option value="1">1x (Normal)</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
              <option value="10">
                10x (membesarkan gambar kecil dan tajam)
              </option>
            </select>
          </div>

          <button
            onClick={processAndDownload}
            style={{ ...styles.downloadBtn, opacity: isLoading ? 0.6 : 1 }}
            disabled={isLoading}
          >
            {isLoading ? "Memproses... ⏳" : "Proses & Download"}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
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
  dropzone: {
    border: "2px dashed #40798c",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    marginBottom: "20px",
    width: "100%",
    maxWidth: "400px",
  },
  preview: {
    maxWidth: "150px",
    borderRadius: "10px",
    marginBottom: "15px",
    border: "2px solid #71b280",
  },
  infoBox: {
    background: "rgba(0,0,0,0.3)",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "15px",
    fontSize: "0.85rem",
    color: "#afeeee",
    textAlign: "left",
  },
  controls: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "15px",
    width: "100%",
    maxWidth: "400px",
  },
  row: {
    marginBottom: "12px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    padding: "5px",
    borderRadius: "5px",
    border: "1px solid #40798c",
    background: "#0b2027",
    color: "white",
  },
  downloadBtn: {
    background: "#71b280",
    color: "#0b2027",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px",
  },
};

export default ImageStudio;
