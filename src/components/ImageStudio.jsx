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

  // FUNGSI PENGAMAN: Sanitasi nama file untuk mencegah XSS lewat metadata
  const sanitizeFileName = (name) => name.replace(/[<>:"/\\|?*]/g, "");

  useEffect(() => {
    if (selectedFile && previewUrl) {
      const finalWidth = fileInfo.width * upscale;
      const finalHeight = fileInfo.height * upscale;

      // IRONCLAD GUARD: Batas aman 8K agar browser tidak pingsan/hang
      if (finalWidth > 8192 || finalHeight > 8192) {
        alert(
          "Dimensi terlalu raksasa! Skala diturunkan ke 1x demi stabilitas browser.",
        );
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

        const resultData = canvas.toDataURL(format, quality);
        setResultPreview(resultData);
      };
    }
  }, [selectedFile, previewUrl, format, upscale, quality, fileInfo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File apa itu gass ? Bukan gambar ya !.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("Foto terlalu besar! Maksimal 15MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setFileInfo({
        size: file.size,
        width: img.width,
        height: img.height,
      });
    };
  };

  const getEstimateSize = () => {
    if (!fileInfo.size) return "0 KB";
    let multiplier =
      format === "image/jpeg" ? 0.7 : format === "image/webp" ? 0.5 : 1.2;
    const effectiveQuality = format === "image/png" ? 1.0 : quality;
    const estimatedBytes =
      fileInfo.size * (upscale * upscale) * multiplier * effectiveQuality;

    return estimatedBytes < 1024 * 1024
      ? (estimatedBytes / 1024).toFixed(0) + " KB"
      : (estimatedBytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleDownload = () => {
    if (!resultPreview) return;
    const cleanName = sanitizeFileName(selectedFile.name.split(".")[0]);
    const link = document.createElement("a");
    link.download = `artup-${cleanName}-${Date.now()}.${format.split("/")[1]}`;
    link.href = resultPreview;
    link.click();
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        ← Kembali
      </button>
      <h2 style={styles.title}>Image Studio 📸</h2>

      {!selectedFile ? (
        <div style={styles.dropzone}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <p style={styles.dropText}>Klik untuk pilih foto</p>
          <div style={styles.formatInfo}>
            <p style={styles.formatList}>.JPG .PNG .WEBP .JFIF .HEIC .AVIF</p>
          </div>
        </div>
      ) : (
        <div style={styles.mainLayout}>
          <div style={styles.previewContainer}>
            <img
              src={resultPreview || previewUrl}
              alt="Preview"
              style={styles.mainImage}
            />
            <div style={styles.floatingTag}>Preview Hasil</div>
          </div>

          <div style={styles.controls}>
            <div style={styles.infoBox}>
              <p>
                Asli: <b>{(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</b>
              </p>
              <p>
                Hasil: <b style={{ color: "#f9d423" }}>{getEstimateSize()}</b>
              </p>
              <p>
                Dimensi: {Math.round(fileInfo.width * upscale)} x{" "}
                {Math.round(fileInfo.height * upscale)} px
              </p>
            </div>

            <div style={styles.row}>
              <label>Format:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={styles.input}
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>

            <div style={styles.row}>
              <label>Kualitas:</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                disabled={format === "image/png"}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.row}>
              <label>Skala:</label>
              <select
                value={upscale}
                onChange={(e) => setUpscale(Number(e.target.value))}
                style={styles.input}
              >
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </div>

            <button onClick={handleDownload} style={styles.downloadBtn}>
              SIMPAN HASIL ✅
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              style={styles.deleteBtn}
            >
              Hapus Foto
            </button>
          </div>
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
    padding: "15px",
    color: "white",
    width: "100%",
    maxWidth: "100vw", // Mencegah lebar melebihi layar
    margin: "0 auto",
    boxSizing: "border-box", // Menjaga padding tetap di dalam elemen
    overflowX: "hidden", // Memotong bocoran ke samping
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
    marginBottom: "20px",
    fontSize: "1.5rem",
  },
  dropzone: {
    border: "2px dashed #40798c",
    padding: "40px 20px",
    borderRadius: "25px",
    textAlign: "center",
    width: "100%",
    maxWidth: "400px",
    background: "rgba(255,255,255,0.02)",
    position: "relative",
    boxSizing: "border-box",
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
  dropText: { color: "#afeeee", fontWeight: "bold" },
  formatInfo: {
    marginTop: "15px",
    borderTop: "1px solid rgba(175,238,238,0.1)",
    paddingTop: "15px",
  },
  formatList: { color: "#f9d423", fontSize: "0.85rem", fontWeight: "bold" },
  mainLayout: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
    boxSizing: "border-box",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "500px", // Dikecilkan sedikit agar aman di HP[cite: 9]
    background: "#000",
    borderRadius: "20px",
    overflow: "hidden",
    border: "2px solid #40798c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "250px",
  },
  mainImage: {
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "contain",
  },
  floatingTag: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(249, 212, 35, 0.9)",
    color: "#000",
    padding: "5px 12px",
    borderRadius: "8px",
    fontSize: "0.7rem",
    fontWeight: "bold",
  },
  controls: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "25px",
    width: "100%",
    maxWidth: "400px",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxSizing: "border-box",
  },
  infoBox: {
    background: "rgba(0,0,0,0.5)",
    padding: "12px",
    borderRadius: "15px",
    marginBottom: "15px",
    fontSize: "0.85rem",
    color: "#afeeee",
    border: "1px solid rgba(175, 238, 238, 0.2)",
  },
  row: {
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap", // Agar input tidak memaksa melebar ke kanan[cite: 9]
  },
  input: {
    padding: "8px",
    borderRadius: "10px",
    border: "1px solid #40798c",
    background: "#0b2027",
    color: "white",
  },
  slider: { flex: 1, minWidth: "120px", cursor: "pointer" },
  downloadBtn: {
    background: "#f9d423",
    color: "#0b2027",
    border: "none",
    padding: "15px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
    width: "100%",
    fontSize: "0.9rem",
    textTransform: "uppercase",
  },
  deleteBtn: {
    background: "none",
    border: "1px solid #ff6b6b",
    color: "#ff6b6b",
    padding: "10px",
    borderRadius: "12px",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px",
    fontSize: "0.8rem",
  },
};

export default ImageStudio;
