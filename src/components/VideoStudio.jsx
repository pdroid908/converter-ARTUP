import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const VideoStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [targetRes, setTargetRes] = useState("720");
  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    loadFFmpeg();
    // Cleanup URL saat komponen tidak lagi digunakan untuk mencegah memory leak
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  const loadFFmpeg = async () => {
    if (status === "ready") return;

    try {
      setStatus("loading");
      const ffmpeg = ffmpegRef.current;

      // Gunakan JSDelivr tapi arahkan ke versi UMD agar lebih stabil di browser
      const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core-umd@0.12.6/dist";

      ffmpeg.on("log", ({ message }) => console.log(message));

      await ffmpeg.load({
        // Kita gunakan toBlobURL agar skrip dari CDN ini dianggap sebagai 'lokal' oleh browser
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
      console.log("ARTUP Mesin Siap!");
    } catch (err) {
      console.error("Gagal muat FFmpeg:", err);
      setStatus("idle");
      alert("Gagal koneksi ke mesin FFmpeg. Coba gunakan Google Chrome.");
    }
  };

  const runVideoProcess = async () => {
    if (status !== "ready" || !file) return;

    const ffmpeg = ffmpegRef.current;
    try {
      setStatus("processing");
      setProgress(0);

      const fileData = await fetchFile(file);
      await ffmpeg.writeFile("input_file", fileData);

      // Perintah resize yang lebih kompatibel
      await ffmpeg.exec([
        "-i",
        "input_file",
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

      const data = await ffmpeg.readFile("output.mp4");

      // PERBAIKAN DOWNLOAD: Pastikan Blob memiliki Type yang jelas
      const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(videoBlob);

      setResultUrl(url);
      setStatus("done");
    } catch (err) {
      console.error("Proses Gagal:", err);
      alert("Gagal memproses video. Coba video lain.");
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
      <div
        style={{
          background: "#222",
          padding: "30px",
          borderRadius: "15px",
          textAlign: "center",
        }}
      >
        <h2>ARTUP Video Resizer</h2>

        {file && status !== "done" && (
          <div style={{ marginBottom: "20px" }}>
            <p>
              Target Resolusi:
              <select
                value={targetRes}
                onChange={(e) => setTargetRes(e.target.value)}
                style={{ marginLeft: "10px" }}
              >
                <option value="480">480p</option>
                <option value="720">720p</option>
                <option value="1080">1080p</option>
              </select>
            </p>
          </div>
        )}

        {status === "done" && resultUrl ? (
          <div>
            <video
              src={resultUrl}
              controls
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <div style={{ marginTop: "20px" }}>
              {/* LINK DOWNLOAD YANG DIPERBAIKI */}
              <a
                href={resultUrl}
                download={`ARTUP_Resized_${file.name}`}
                style={{
                  display: "block",
                  padding: "15px",
                  background: "#4cc9f0",
                  color: "black",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                DOWNLOAD HASIL SEKARANG ⬇️
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setStatus("ready");
                  setResultUrl(null);
                }}
                style={{
                  marginTop: "15px",
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                }}
              >
                Proses Video Lain
              </button>
            </div>
          </div>
        ) : (
          <div>
            {!file ? (
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files[0])}
              />
            ) : (
              <button
                onClick={runVideoProcess}
                disabled={status !== "ready"}
                style={{
                  background: status === "processing" ? "#555" : "#3a86ff",
                  color: "white",
                  padding: "15px 30px",
                  borderRadius: "12px",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                {status === "processing"
                  ? `Mengecilkan... ${progress}%`
                  : "MULAI RESIZE"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;
