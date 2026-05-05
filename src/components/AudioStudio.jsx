import React, { useState, useRef } from "react";


const AudioStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [format, setFormat] = useState("audio/wav"); // Default ke WAV (mudah)
  const [quality, setQuality] = useState(0.8); // Skala 0.1 - 1.0
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0); // <-- TAMBAHKAN INI
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      setAudioUrl(null);

      // Ambil durasi video untuk estimasi ukuran
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => setDuration(video.duration);
      video.src = URL.createObjectURL(selectedFile);
    }
  };

  // Logika Estimasi Ukuran File
  const getEstimateSize = () => {
    if (!duration) return "0 KB";

    let sizeInBytes;
    if (format === "audio/wav") {
      // WAV: SampleRate * Channels * BitDepth * Duration
      // Asumsi standar: 44100 * 2 * 2 (16bit)
      sizeInBytes = 44100 * 2 * 2 * duration;
    } else {
      // MP3 (Simulasi): Bitrate (kbps) * Duration / 8
      // Bitrate dinamis berdasarkan slider quality (128kbps - 320kbps)
      const bitrate = 128 + 192 * quality;
      sizeInBytes = (bitrate * 1000 * duration) / 8;
    }

    return sizeInBytes < 1024 * 1024
      ? (sizeInBytes / 1024).toFixed(0) + " KB"
      : (sizeInBytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const processAudio = async () => {
  if (!file) return;
  setIsProcessing(true);
  setProgress(5); 

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    setProgress(20); 

    // LANGKAH 1: Selalu buat WAV dulu (Master Data)
    const wavBlob = bufferToWav(audioBuffer);
    if (format === "audio/wav") {
      setAudioUrl(URL.createObjectURL(wavBlob));
      setProgress(100);
    } else {
      // LANGKAH 2: Konversi hasil WAV tadi ke MP3
      // Kita panggil fungsi baru di bawah ini
      const mp3Blob = await wavToMp3Async(audioBuffer, (p) => {
        setProgress(20 + Math.floor(p * 0.8));
      });

      if (mp3Blob) {
        setAudioUrl(URL.createObjectURL(mp3Blob));
      } else {
        setAudioUrl(URL.createObjectURL(wavBlob));
      }
    }
  } catch (error) {
    console.error("Proses gagal:", error);
    alert("Gagal memproses audio.");
  } finally {
    setIsProcessing(false);
  }
};
  const cardStyle = {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "25px",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxSizing: "border-box",
    width: "100%", // Pastikan selalu 100% dari parent
    minWidth: 0, // Mencegah flex/grid memaksanya melebar
  };

  // Helper WAV (Sama seperti sebelumnya)
  const bufferToWav = (abuffer) => {
    let numOfChan = abuffer.numberOfChannels,
      length = abuffer.length * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      pos = 0;
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);
    for (let i = 0; i < abuffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let s = Math.max(-1, Math.min(1, abuffer.getChannelData(channel)[i]));
        view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        pos += 2;
      }
    }
    return new Blob([buffer], { type: "audio/wav" });
  };


  const wavToMp3Async = async (audioBuffer, onProgress) => {
    const lame = window.lamejs;
    if (!lame) return null;

    const channels = audioBuffer.numberOfChannels;
    const kbps = Math.round(128 + 192 * parseFloat(quality));
    const mp3encoder = new lame.Mp3Encoder(
      channels,
      audioBuffer.sampleRate,
      kbps,
    );
    const mp3Data = [];

    const floatToInt16 = (samples) => {
      const int16 = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return int16;
    };

    const left = floatToInt16(audioBuffer.getChannelData(0));
    const right =
      channels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : left;

    const blockSize = 1152;
    for (let i = 0; i < left.length; i += blockSize) {
      const leftChunk = left.subarray(i, i + blockSize);
      const rightChunk = right.subarray(i, i + blockSize);
      let mp3buf =
        channels === 2
          ? mp3encoder.encodeBuffer(leftChunk, rightChunk)
          : mp3encoder.encodeBuffer(leftChunk);

      if (mp3buf.length > 0) mp3Data.push(mp3buf);

      if (i % (blockSize * 100) === 0) {
        onProgress(Math.round((i / left.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const flush = mp3encoder.flush();
    if (flush.length > 0) mp3Data.push(flush);
    onProgress(100);
    return new Blob(mp3Data, { type: "audio/mp3" });
  };

  // 1. Tambahkan fungsi helper ini
  const getLame = () => {
    if (typeof window !== "undefined" && window.lamejs) {
      return window.lamejs;
    }
    return null;
  };

  // 2. Gunakan fungsi bufferToMp3 yang sudah diperbaiki total
  const bufferToMp3Async = async (audioBuffer, onProgress) => {
    const lame = window.lamejs;
    if (!lame) return null;

    const channels = audioBuffer.numberOfChannels;
    const kbps = Math.round(128 + 192 * parseFloat(quality));
    const mp3encoder = new lame.Mp3Encoder(
      channels,
      audioBuffer.sampleRate,
      kbps,
    );
    const mp3Data = [];

    const floatToInt16 = (samples) => {
      const int16 = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return int16;
    };

    const left = floatToInt16(audioBuffer.getChannelData(0));
    const right =
      channels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : left;

    const blockSize = 1152;
    for (let i = 0; i < left.length; i += blockSize) {
      const leftChunk = left.subarray(i, i + blockSize);
      const rightChunk = right.subarray(i, i + blockSize);
      let mp3buf =
        channels === 2
          ? mp3encoder.encodeBuffer(leftChunk, rightChunk)
          : mp3encoder.encodeBuffer(leftChunk);

      if (mp3buf.length > 0) mp3Data.push(mp3buf);

      // Update progress setiap 100 blok
      if (i % (blockSize * 100) === 0) {
        onProgress(Math.round((i / left.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 0)); // Cegah Freeze
      }
    }

    const flush = mp3encoder.flush();
    if (flush.length > 0) mp3Data.push(flush);
    onProgress(100);
    return new Blob(mp3Data, { type: "audio/mp3" });
  };
  return (
    <div className="studio-container">
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
        Audio Studio 🎵
      </h2>

      <div
        style={{
          marginTop: "50px",
          padding: "1px", // Ruang untuk gradient border
          background:
            "linear-gradient(90deg, transparent, rgba(113, 178, 128, 0.5), transparent)",
          borderRadius: "20px",
          width: "fit-content",
          marginInline: "auto",
          animation: "pulse 3s infinite", // Menggunakan keyframe pulse yang sudah ada di App.css kamu
          boxShadow: "0 0 20px rgba(113, 178, 128, 0.1)",
        }}
      >
        <div
          style={{
            background: "#0b2027", // Warna dasar gelap webmu
            padding: "15px 30px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            style={{
              fontSize: "1.2rem",
              filter: "drop-shadow(0 0 5px #71b280)",
            }}
          >
            🛡️
          </span>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#ffffff",
              margin: 0,
              fontWeight: "500",
              letterSpacing: "0.5px",
              opacity: 0.8,
            }}
          >
            <span style={{ color: "#71b280", fontWeight: "800" }}>
              PEMBERITAHUAN:
            </span>{" "}
            Kami tidak mendukung penggunaan karya berhak cipta tanpa izin untuk
            tujuan komersial.
          </p>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          // Gunakan grid-template-columns otomatis:
          // Jika layar lebar (>800px) pakai 1fr 350px, jika sempit tumpuk ke bawah
          gridTemplateColumns: file
            ? window.innerWidth > 800
              ? "1fr 350px"
              : "1fr"
            : "1fr",
          gap: "20px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Panel Kiri: Input & Preview */}
        <div
          className="glass-card"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {!file ? (
            <div className="dropzone-area">
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
              <p style={{ fontSize: "40px" }}>🎬</p>
              <p style={{ color: "#afeeee" }}>
                Klik/Seret MP4 untuk ambil suaranya
              </p>
            </div>
          ) : (
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "20px",
                  borderRadius: "20px",
                  marginBottom: "20px",
                }}
              >
                <p style={{ color: "white", fontWeight: "bold" }}>
                  📹 {file.name}
                </p>
                <p style={{ color: "#71b280", fontSize: "0.8rem" }}>
                  Durasi: {Math.floor(duration)} detik
                </p>

                {/* TEMPELKAN KODE PROGRESS DI SINI */}
                {isProcessing && (
                  <div style={{ marginTop: "20px", textAlign: "left" }}>
                    <p
                      style={{
                        color: "#f9d423",
                        fontSize: "0.8rem",
                        marginBottom: "5px",
                      }}
                    >
                      Sedang Mengolah: {progress}%
                    </p>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: "100%",
                          background: "#71b280",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              {audioUrl && (
                <div style={{ animation: "fadeIn 0.5s" }}>
                  <p
                    style={{
                      color: "#f9d423",
                      fontSize: "0.9rem",
                      marginBottom: "10px",
                    }}
                  >
                    Hasil Konversi:
                  </p>
                  <audio src={audioUrl} controls style={{ width: "100%" }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Kanan: Kontrol (Hanya muncul jika file dipilih) */}
        {file && (
          <div
            className="glass-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              textAlign: "left",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#f9d423" }}>
              Pengaturan Audio
            </h3>

            <div>
              <label style={{ fontSize: "0.8rem", color: "#afeeee" }}>
                Format Output
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  borderRadius: "10px",
                  background: "#0b2027",
                  color: "white",
                  border: "1px solid #40798c",
                }}
              >
                <option value="audio/wav">
                  WAV (Kualitas Tinggi / ukuran tetap)
                </option>
                <option value="audio/mp3">MP3 (Kecil / Kompresi)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "#afeeee" }}>
                Kualitas ({Math.round(quality * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="custom-slider"
                style={{ width: "100%", marginTop: "10px" }}
              />
            </div>

            <div
              style={{
                background: "rgba(249, 212, 35, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid rgba(249, 212, 35, 0.2)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.8rem", color: "white" }}>
                Estimasi Ukuran:
              </p>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#f9d423",
                }}
              >
                {getEstimateSize()}
              </p>
            </div>

            {!audioUrl ? (
              <button
                onClick={processAudio}
                className="action-btn"
                style={{
                  background: "#3a86ff",
                  color: "white",
                  border: "none",
                  padding: "15px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {isProcessing ? "MEMPROSES..." : "KONVERSI SEKARANG"}
              </button>
            ) : (
              <a
                href={audioUrl}
                download={`artup-${Date.now()}.${format === "audio/wav" ? "wav" : "mp3"}`}
                className="action-btn"
                style={{
                  background: "#71b280",
                  color: "#0b2027",
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "15px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                }}
              >
                DOWNLOAD HASIL ✅
              </a>
            )}

            <button
              onClick={() => {
                setFile(null);
                setAudioUrl(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#ff6b6b",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Batal & Ganti Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};;;

export default AudioStudio;
