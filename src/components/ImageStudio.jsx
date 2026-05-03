import React, { useState, useRef, useEffect } from "react";

const ImageStudio = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [format, setFormat] = useState("image/png");
  const [upscale, setUpscale] = useState(1);
  const [fileInfo, setFileInfo] = useState({ size: 0, width: 0, height: 0 });
  const [quality, setQuality] = useState(0.8);
  const [resultPreview, setResultPreview] = useState(null);
  const canvasRef = useRef(null);

  const sanitizeFileName = (name) => name.replace(/[<>:"/\\|?*]/g, "");

  useEffect(() => {
    if (selectedFile && previewUrl) {
      const finalWidth = fileInfo.width * upscale;
      const finalHeight = fileInfo.height * upscale;

      if (finalWidth > 8192 || finalHeight > 8192) {
        alert("Dimensi terlalu besar! Maksimal 8K demi kestabilan.");
        setUpscale(1);
        return;
      }

      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setResultPreview(canvas.toDataURL(format, quality));
      };
    }
  }, [selectedFile, previewUrl, format, upscale, quality, fileInfo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setFileInfo({ size: file.size, width: img.width, height: img.height });
    };
  };

  const getEstimateSize = () => {
    if (!fileInfo.size) return "0 KB";
    let multiplier =
      format === "image/jpeg" ? 0.7 : format === "image/webp" ? 0.5 : 1.2;
    const estimatedBytes =
      fileInfo.size * (upscale * upscale) * multiplier * quality;
    return estimatedBytes < 1024 * 1024
      ? (estimatedBytes / 1024).toFixed(0) + " KB"
      : (estimatedBytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="studio-container">
      <button onClick={onBack} className="backBtn" style={styles.backBtn}>
        ← Kembali ke Menu
      </button>

      <h2
        style={{ color: "#f9d423", marginBottom: "25px", textAlign: "center" }}
      >
        Image Studio <span style={{ fontSize: "0.8em" }}>📸</span>
      </h2>

      {!selectedFile ? (
        <div className="dropzone-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>☁️</div>
          <p
            style={{ color: "#afeeee", fontWeight: "bold", fontSize: "1.1rem" }}
          >
            Klik atau Seret Foto ke Sini
          </p>
          <p
            style={{
              color: "rgba(249, 212, 35, 0.6)",
              fontSize: "0.8rem",
              marginTop: "10px",
            }}
          >
            Mendukung PNG, JPG, WEBP, AVIF (Maks 15MB)
          </p>
        </div>
      ) : (
        <div className="studio-grid">
          {/* Preview Panel */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div style={styles.previewContainer}>
              <img
                src={resultPreview || previewUrl}
                alt="Preview"
                style={styles.mainImage}
              />
              <div className="floatingTag" style={styles.floatingTag}>
                Live Preview
              </div>
            </div>
            <div className="infoBox" style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span>Dimensi Akhir:</span>
                <b style={{ color: "#f9d423" }}>
                  {Math.round(fileInfo.width * upscale)} x{" "}
                  {Math.round(fileInfo.height * upscale)} px
                </b>
              </div>
              <div style={styles.infoRow}>
                <span>Estimasi Ukuran:</span>
                <b style={{ color: "#f9d423" }}>{getEstimateSize()}</b>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "10px",
              }}
            >
              Pengaturan Konversi
            </h3>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Format Output</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={styles.input}
              >
                <option value="image/png">PNG (Lossless)</option>
                <option value="image/jpeg">JPG (Kecil)</option>
                <option value="image/webp">WebP (Modern)</option>
              </select>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Kualitas ({Math.round(quality * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                disabled={format === "image/png"}
                className="custom-slider"
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Upscale Skala</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 2, 4].map((v) => (
                  <button
                    key={v}
                    onClick={() => setUpscale(v)}
                    style={{
                      ...styles.scaleBtn,
                      background:
                        upscale === v ? "#3a86ff" : "rgba(255,255,255,0.05)",
                      borderColor:
                        upscale === v ? "#3a86ff" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {v}x
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const link = document.createElement("a");
                link.download = `artup-${Date.now()}.${format.split("/")[1]}`;
                link.href = resultPreview;
                link.click();
              }}
              className="action-btn"
              style={styles.downloadBtn}
            >
              📥 SIMPAN SEKARANG
            </button>

            <button
              onClick={() => setSelectedFile(null)}
              style={styles.deleteBtn}
            >
              Ganti Foto Lain
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

const styles = {
  backBtn: {
    background: "rgba(113, 178, 128, 0.1)",
    border: "1px solid #71b280",
    color: "#71b280",
    padding: "10px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "20px",
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
  previewContainer: {
    position: "relative",
    width: "100%",
    background: "#051115",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mainImage: { maxWidth: "100%", maxHeight: "500px", objectFit: "contain" },
  floatingTag: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "#f9d423",
    color: "#000",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "bold",
  },
  infoBox: {
    background: "rgba(0,0,0,0.3)",
    padding: "15px",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
  },
  controlGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.85rem", color: "#afeeee", fontWeight: "500" },
  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "#0b2027",
    color: "white",
    cursor: "pointer",
  },
  scaleBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  downloadBtn: {
    background: "#3a86ff",
    color: "white",
    border: "none",
    padding: "18px",
    borderRadius: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
    marginTop: "10px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#ff6b6b",
    cursor: "pointer",
    fontSize: "0.85rem",
    textDecoration: "underline",
  },
};

export default ImageStudio;
