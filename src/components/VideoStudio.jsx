import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const VideoStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [targetRes, setTargetRes] = useState("720");
  const [duration, setDuration] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
  const ffmpegRef = useRef(new FFmpeg());

  // Pantau perubahan ukuran layar agar responsif
  useEffect(() => {
    loadFFmpeg();
    const handleResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResultUrl(null);
      setProgress(0);

      // Paksa pancing durasi
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setDuration(video.duration);
        // Jika mesin sudah ready, biarkan ready. Jika belum, load.
        if (status === "idle") loadFFmpeg();
        else if (status !== "loading" && status !== "processing")
          setStatus("ready");
      };
      video.src = URL.createObjectURL(selected);
    }
  };

  const loadFFmpeg = async () => {
    if (status === "ready" || status === "processing") return;

    try {
      setStatus("loading");
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("progress", ({ progress }) =>
        setProgress(Math.round(progress * 100)),
      );

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });

      setStatus("ready"); // MENGAKTIFKAN TOMBOL
    } catch (err) {
      console.error("FFmpeg load error:", err);
      setStatus("idle"); // Reset agar bisa coba lagi
    }
  };

  // Logika Estimasi Ukuran MP4 (Bitrate rata-rata)
  const getEstimateSize = () => {
    if (!duration) return "Calculating...";
    let bitrate; // dalam kbps
    if (targetRes === "720") bitrate = 2500;
    else if (targetRes === "480") bitrate = 1000;
    else bitrate = 500;

    const sizeInBytes = (bitrate * 1000 * duration) / 8;
    return sizeInBytes < 1024 * 1024
      ? (sizeInBytes / 1024).toFixed(0) + " KB"
      : (sizeInBytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const runVideoProcess = async () => {
    if (!file) return;
    const ffmpeg = ffmpegRef.current;
    setStatus("processing");

    try {
      // Pastikan data file terbaca
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile("input", fileData);

      await ffmpeg.exec([
        "-i",
        "input",
        "-vf",
        `scale=-2:${targetRes}:flags=fast_bilinear`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "35",
        "-maxrate",
        "800k",
        "-bufsize",
        "1600k",
        "-threads",
        "0",
        "-c:a",
        "copy",
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      setResultUrl(
        URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" })),
      );
      setStatus("done");
    } catch (err) {
      console.error("Proses gagal:", err);
      alert("Gagal memproses video. Coba refresh halaman.");
      setStatus("ready");
    }
  };

  return (
    <div
      className="studio-container"
      style={{
        padding: "15px",
        maxWidth: "1200px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <button
        onClick={onBack}
        className="backBtn"
        style={{
          border: "1px solid #71b280",
          color: "#71b280",
          background: "none",
          padding: "8px 15px",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Kembali
      </button>

      <h2
        style={{ color: "#f9d423", textAlign: "center", marginBottom: "30px" }}
      >
        Video Studio offline 🎬
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: file && !isMobile ? "row" : "column",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        {/* Panel Kiri: Preview/Input */}
        <div
          className="glass-card"
          style={{
            flex: 1,
            padding: "20px",
            borderRadius: "25px",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
            minWidth: 0,
          }}
        >
          {!file ? (
            <div
              style={{
                border: "2px dashed #40798c",
                padding: "60px 20px",
                borderRadius: "20px",
                position: "relative",
              }}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
              <p style={{ fontSize: "40px", margin: 0 }}>📹</p>
              <p style={{ color: "#afeeee" }}>Pilih Video untuk Resize</p>
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              {resultUrl ? (
                <video
                  src={resultUrl}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: "15px",
                    maxHeight: "400px",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "30px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "20px",
                  }}
                >
                  <p style={{ color: "white", wordBreak: "break-all" }}>
                    📺 {file.name}
                  </p>
                  {status === "processing" && (
                    <div style={{ marginTop: "20px" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background: "#0b2027",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "#f9d423",
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                      <p
                        style={{
                          color: "#f9d423",
                          marginTop: "10px",
                          fontSize: "0.9rem",
                        }}
                      >
                        Memproses: {progress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Kanan: Kontrol */}
        {file && (
          <div
            className="glass-card"
            style={{
              width: isMobile ? "100%" : "350px",
              padding: "20px",
              borderRadius: "25px",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxSizing: "border-box",
            }}
          >
            <h3 style={{ margin: 0, color: "#f9d423", fontSize: "1.1rem" }}>
              ⚙️ Kontrol Video
            </h3>

            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: "0.8rem", color: "#afeeee" }}>
                Target Resolusi:
              </label>
              <select
                value={targetRes}
                onChange={(e) => setTargetRes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "8px",
                  borderRadius: "12px",
                  background: "#0b2027",
                  color: "white",
                  border: "1px solid #40798c",
                }}
              >
                <option value="720">720p (HD) - Bagus</option>
                <option value="480">480p (SD) - Cepat</option>
                <option value="360">360p (Kecil) - Kilat</option>
              </select>
            </div>

            <div
              style={{
                background: "rgba(249, 212, 35, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid rgba(249, 212, 35, 0.2)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "white",
                  opacity: 0.8,
                }}
              >
                Estimasi Ukuran Akhir:
              </p>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "#f9d423",
                }}
              >
                ~{getEstimateSize()}
              </p>
            </div>

            {status === "done" ? (
              <a
                href={resultUrl}
                download={`artup-video-${Date.now()}.mp4`}
                style={{
                  background: "#71b280",
                  color: "#0b2027",
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "15px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                DOWNLOAD HASIL ✅
              </a>
            ) : (
              <button
                onClick={runVideoProcess}
                disabled={
                  status === "loading" ||
                  status === "processing" ||
                  status === "idle"
                }
                style={{
                  background:
                    status === "loading" ||
                    status === "processing" ||
                    status === "idle"
                      ? "#555"
                      : "#3a86ff",
                  color: "white",
                  background: "#3a86ff",
                  color: "white",
                  border: "none",
                  padding: "15px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  opacity:
                    status === "processing" || status === "loading" ? 0.5 : 1,
                  fontSize: "1rem",
                }}
              >
                {status === "loading"
                  ? "Menyiapkan Mesin..."
                  : status === "processing"
                    ? "Mengecilkan..."
                    : "MULAI RESIZE ⚡"}
              </button>
            )}

            <button
              onClick={() => {
                setFile(null);
                setResultUrl(null);
                setStatus("ready");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#ff6b6b",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Batal & Ganti Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;
