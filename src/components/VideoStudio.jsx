import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const VideoStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, loading, ready, processing, done
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [targetRes, setTargetRes] = useState("720"); // Default 720p
  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    if (status === "ready") return;
    try {
      setStatus("loading");
      const ffmpeg = ffmpegRef.current;

      // Menggunakan CDN jsDelivr yang stabil untuk FFmpeg Core
      const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";

      ffmpeg.on("log", ({ message }) => console.log("FFmpeg Log:", message));
      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

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

      setStatus("ready");
    } catch (err) {
      console.error("Gagal muat FFmpeg:", err);
      setStatus("idle");
      alert(
        "Gagal menyiapkan mesin browser. Coba refresh atau gunakan Google Chrome.",
      );
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResultUrl(null);
      setProgress(0);
    }
  };

  const runVideoProcess = async () => {
    if (status !== "ready" || !file) return;

    const ffmpeg = ffmpegRef.current;
    try {
      setStatus("processing");
      setProgress(0);

      // 1. Tulis file ke memori virtual FFmpeg
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile("input_video", fileData);

      // 2. Jalankan perintah Resize & Kompresi
      // -vf scale=-2:targetRes (Mengubah resolusi sambil menjaga aspek rasio)
      // -crf 28 (Mengecilkan ukuran file dengan tetap menjaga kualitas)
      // -preset ultrafast (Agar proses di browser tidak terlalu lama)
      await ffmpeg.exec([
        "-i",
        "input_video",
        "-vf",
        `scale=-2:${targetRes}`,
        "-vcodec",
        "libx264",
        "-crf",
        "28",
        "-preset",
        "ultrafast",
        "output.mp4",
      ]);

      // 3. Baca hasil dari memori virtual
      const data = await ffmpeg.readFile("output.mp4");
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" }),
      );

      setResultUrl(url);
      setStatus("done");
    } catch (err) {
      console.error("Proses Gagal:", err);
      alert("Terjadi kesalahan saat memproses video.");
      setStatus("ready");
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <button
        onClick={onBack}
        style={{ marginBottom: "20px", cursor: "pointer" }}
      >
        ← Kembali
      </button>

      <div
        style={{
          background: "#222",
          padding: "30px",
          borderRadius: "15px",
          textAlign: "center",
        }}
      >
        <h2>Video Compressor (Client-Side)</h2>
        <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
          Data diolah di perangkatmu, aman & privat.
        </p>

        {!file ? (
          <div
            style={{
              border: "2px dashed #444",
              padding: "40px",
              borderRadius: "10px",
            }}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              id="videoInput"
              hidden
            />
            <label
              htmlFor="videoInput"
              style={{ cursor: "pointer", color: "#3a86ff" }}
            >
              Pilih Video untuk Mulai
            </label>
          </div>
        ) : (
          <div>
            <p>Video: {file.name}</p>

            <div style={{ margin: "20px 0" }}>
              <label>Pilih Resolusi Akhir: </label>
              <select
                value={targetRes}
                onChange={(e) => setTargetRes(e.target.value)}
                disabled={status === "processing"}
                style={{ padding: "5px", borderRadius: "5px" }}
              >
                <option value="480">480p (Paling Kecil)</option>
                <option value="720">720p (HD)</option>
                <option value="1080">1080p (Full HD)</option>
              </select>
            </div>

            {status === "done" && resultUrl ? (
              <div style={{ marginTop: "20px" }}>
                <p style={{ color: "#4cc9f0" }}>✅ Berhasil Dikecilkan!</p>
                <video
                  src={resultUrl}
                  controls
                  style={{ width: "100%", borderRadius: "10px" }}
                />
                <br />
                <a
                  href={resultUrl}
                  download={`ARTUP_resized_${file.name}`}
                  style={{
                    display: "inline-block",
                    marginTop: "15px",
                    padding: "10px 20px",
                    background: "#4cc9f0",
                    color: "black",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Download Hasil ⬇️
                </a>
              </div>
            ) : (
              <button
                onClick={runVideoProcess}
                disabled={status !== "ready" || status === "processing"}
                style={{
                  background:
                    status === "loading" || status === "processing"
                      ? "#555"
                      : "#3a86ff",
                  color: "white",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "12px",
                  cursor:
                    status === "loading" || status === "processing"
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "bold",
                  width: "100%",
                  marginTop: "10px",
                }}
              >
                {status === "loading"
                  ? "Menyiapkan Mesin..."
                  : status === "processing"
                    ? `Memproses... (${progress}%)`
                    : "MULAI RESIZE ⚡"}
              </button>
            )}

            <button
              onClick={() => {
                setFile(null);
                setStatus("ready");
                setResultUrl(null);
              }}
              style={{
                marginTop: "20px",
                background: "none",
                border: "none",
                color: "#ff6b6b",
                cursor: "pointer",
              }}
            >
              Ganti Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;
