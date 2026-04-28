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

        // Anti-alias off untuk pixel art atau on untuk foto halus
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export hasil ke state preview
        const resultData = canvas.toDataURL(format, quality);
        setResultPreview(resultData);
      };
    }
  }, [selectedFile, previewUrl, format, upscale, quality, fileInfo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // SECURITY CHECK: Hanya izinkan file gambar asli
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

  // ESTIMASI UKURAN PINTAR (KB / MB)
  const getEstimateSize = () => {
    if (!fileInfo.size) return "0 KB";

    let multiplier =
      format === "image/jpeg" ? 0.7 : format === "image/webp" ? 0.5 : 1.2;
    const effectiveQuality = format === "image/png" ? 1.0 : quality;
    const estimatedBytes =
      fileInfo.size * (upscale * upscale) * multiplier * effectiveQuality;

    if (estimatedBytes < 1024 * 1024) {
      return (estimatedBytes / 1024).toFixed(0) + " KB";
    } else {
      return (estimatedBytes / (1024 * 1024)).toFixed(2) + " MB";
    }
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
      <h2
        style={{ color: "#f9d423", textAlign: "center", marginBottom: "20px" }}
      >
        Image Studio 📸
      </h2>

      {!selectedFile ? (
        <div style={styles.dropzone}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <p style={{ color: "#afeeee", fontWeight: "bold" }}>
            Klik untuk pilih foto
          </p>
          <div
            style={{
              marginTop: "15px",
              borderTop: "1px solid rgba(175,238,238,0.1)",
              paddingTop: "15px",
            }}
          >
            <p
              style={{
                color: "#f9d423",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              .JPG .PNG .WEBP .JFIF .HEIC .AVIF
            </p>
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
              <label>Format Tujuan:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={styles.input}
              >
                <option value="image/png">PNG </option>
                <option value="image/jpeg">JPG </option>
                <option value="image/webp">WebP </option>
              </select>
            </div>

            <div style={styles.row}>
              <label>Kualitas ({Math.round(quality * 100)}%):</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                disabled={format === "image/png"}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{
                  flex: 1,
                  marginLeft: "10px",
                  cursor: format === "image/png" ? "not-allowed" : "pointer",
                }}
              />
            </div>

            {format === "image/png" && (
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#ff6b6b",
                  marginTop: "-10px",
                  marginBottom: "15px",
                  fontStyle: "italic",
                }}
              >
                * PNG selalu kualitas penuh. Pilih JPG/WebP untuk kompresi.
              </p>
            )}

            <div style={styles.row}>
              <label>Skala / Upscale:</label>
              <select
                value={upscale}
                onChange={(e) => setUpscale(Number(e.target.value))}
                style={styles.input}
              >
                <option value="1">1x (Normal)</option>
                <option value="2">2x (Tajam)</option>
                <option value="4">4x (Besar)</option>
              </select>
            </div>

            <button onClick={handleDownload} style={styles.downloadBtn}>
              SIMPAN KE PERANGKAT ✅
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                ...styles.downloadBtn,
                background: "none",
                border: "1px solid #ff6b6b",
                color: "#ff6b6b",
                marginTop: "10px",
                fontSize: "0.8rem",
              }}
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
    padding: "20px",
    color: "white",
    maxWidth: "1200px",
    margin: "0 auto",
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
    padding: "50px",
    borderRadius: "25px",
    textAlign: "center",
    width: "100%",
    maxWidth: "500px",
    background: "rgba(255,255,255,0.02)",
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
  mainLayout: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "600px",
    background: "#000",
    borderRadius: "20px",
    overflow: "hidden",
    border: "2px solid #40798c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
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
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  controls: {
    background: "rgba(255,255,255,0.05)",
    padding: "25px",
    borderRadius: "25px",
    width: "100%",
    maxWidth: "420px",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  infoBox: {
    background: "rgba(0,0,0,0.5)",
    padding: "15px",
    borderRadius: "15px",
    marginBottom: "20px",
    fontSize: "0.9rem",
    color: "#afeeee",
    border: "1px solid rgba(175, 238, 238, 0.2)",
  },
  row: {
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
  },
  input: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #40798c",
    background: "#0b2027",
    color: "white",
    outline: "none",
  },
  downloadBtn: {
    background: "#f9d423",
    color: "#0b2027",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
    width: "100%",
    fontSize: "1rem",
    textTransform: "uppercase",
  },
};

export default ImageStudio;
