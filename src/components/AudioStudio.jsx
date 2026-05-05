import React, { useState } from "react";

const AudioStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  // ... (Logika handleFileChange, getEstimateSize, processAudio, bufferToWav tetap sama) ...
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      setAudioUrl(null);
      setProgress(0);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => setDuration(video.duration);
      video.src = URL.createObjectURL(selectedFile);
    }
  };

  const getEstimateSize = () => {
    if (!duration) return "0 KB";
    const sizeInBytes = 44100 * 2 * 2 * duration;
    return sizeInBytes < 1024 * 1024
      ? (sizeInBytes / 1024).toFixed(0) + " KB"
      : (sizeInBytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setProgress(60);
      const wavBlob = bufferToWav(audioBuffer);
      setAudioUrl(URL.createObjectURL(wavBlob));
      setProgress(100);
    } catch (error) {
      alert("Gagal mengekstrak audio.");
    } finally {
      setIsProcessing(false);
    }
  };

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

  return (
    <div
      className="studio-container"
      style={{ padding: "10px", maxWidth: "1000px", margin: "0 auto" }}
    >
      <style>{`
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 850px) {
          .responsive-grid {
            grid-template-columns: ${file ? "1fr 350px" : "1fr"};
          }
        }
        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 20px;
        }
        @media (max-width: 600px) {
          h2 { fontSize: "1.5rem" !important; }
          .dropzone-area { padding: 20px !important; }
        }
      `}</style>

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
        style={{ color: "#f9d423", textAlign: "center", marginBottom: "10px" }}
      >
        Audio Extractor 🎥 No Data Used
      </h2>

      {/* Peringatan Komersial */}
      <div
        style={{
          background: "rgba(255, 107, 107, 0.1)",
          border: "1px solid #ff6b6b",
          padding: "12px",
          borderRadius: "15px",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#ff6b6b", fontSize: "0.75rem", margin: 0 }}>
          ⚠️ <strong>ARTUP STUDIO:</strong> Kami tidak mendukung penggunaan
          karya berhak cipta tanpa izin untuk tujuan komersial.
        </p>
      </div>

      <div className="responsive-grid">
        {/* Panel Utama */}
        <div className="glass-card" style={{ textAlign: "center" }}>
          {!file ? (
            <div
              className="dropzone-area"
              style={{
                border: "2px dashed #71b280",
                borderRadius: "20px",
                padding: "40px",
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
              <p style={{ fontSize: "30px" }}>📥</p>
              <p style={{ color: "#afeeee", fontSize: "0.9rem" }}>
                Klik/Seret Video (WAV)
              </p>
            </div>
          ) : (
            <div>
              <p
                style={{
                  color: "white",
                  fontWeight: "bold",
                  wordBreak: "break-all",
                  fontSize: "0.9rem",
                }}
              >
                📹 {file.name}
              </p>
              {isProcessing && (
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#71b280",
                        transition: "width 0.3s",
                      }}
                    ></div>
                  </div>
                  <p
                    style={{
                      color: "#f9d423",
                      fontSize: "0.7rem",
                      marginTop: "10px",
                    }}
                  >
                    Processing: {progress}%
                  </p>
                </div>
              )}
              {audioUrl && (
                <div style={{ marginTop: "20px" }}>
                  <audio src={audioUrl} controls style={{ width: "100%" }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Kontrol */}
        {file && (
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <h3 style={{ color: "#f9d423", margin: 0, fontSize: "1rem" }}>
              Detail Output
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#afeeee" }}>
              Format: <strong>WAV (Original)</strong>
            </p>

            <div
              style={{
                background: "rgba(249, 212, 35, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid rgba(249, 212, 35, 0.2)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.7rem", color: "white" }}>
                Estimasi Ukuran:
              </p>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "1.1rem",
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
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {isProcessing ? "MENGOLAH..." : "MULAI EKSTRAK"}
              </button>
            ) : (
              <a
                href={audioUrl}
                download={`artup-extract-${Date.now()}.wav`}
                className="action-btn"
                style={{
                  background: "#71b280",
                  color: "#0b2027",
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                Save to file ✅
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
                cursor: "pointer",
                fontSize: "0.75rem",
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

export default AudioStudio;
