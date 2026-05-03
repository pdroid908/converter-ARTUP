import React, { useState, useRef } from "react";

const AudioStudio = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      setAudioUrl(null);
    } else {
      alert("Tolong pilih file video MP4/WebM!");
    }
  };

  const extractAudio = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert ke format WAV (tanpa library tambahan agar ringan)
      const wavBlob = bufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);

      setAudioUrl(url);
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      alert("Gagal mengekstrak audio. Pastikan format video didukung.");
      setIsProcessing(false);
    }
  };

  // Helper untuk mengubah AudioBuffer ke WAV secara lokal
  const bufferToWav = (abuffer) => {
    let numOfChan = abuffer.numberOfChannels,
      length = abuffer.length * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [],
      i,
      sample,
      offset = 0,
      pos = 0;

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([buffer], { type: "audio/wav" });
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
        Audio Extractor 🎧
      </h2>

      <div
        className="glass-card"
        style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center" }}
      >
        {!file ? (
          <div
            className="dropzone-area"
            style={{
              border: "2px dashed #40798c",
              padding: "40px",
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
            <p style={{ color: "#afeeee" }}>
              Pilih Video (MP4) untuk diambil suaranya
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                padding: "15px",
                borderRadius: "15px",
              }}
            >
              <p style={{ color: "white", margin: 0 }}>📹 {file.name}</p>
              <p style={{ color: "#71b280", fontSize: "0.8rem" }}>
                Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {!audioUrl ? (
              <button
                onClick={extractAudio}
                disabled={isProcessing}
                style={{
                  background: "#3a86ff",
                  color: "white",
                  border: "none",
                  padding: "15px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                }}
              >
                {isProcessing
                  ? "Sedang Memproses... ⏳"
                  : "EKSTRAK AUDIO SEKARANG"}
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <audio src={audioUrl} controls style={{ width: "100%" }} />
                <a
                  href={audioUrl}
                  download={`artup-audio-${Date.now()}.wav`}
                  style={{
                    background: "#f9d423",
                    color: "#0b2027",
                    textDecoration: "none",
                    padding: "15px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                  }}
                >
                  DOWNLOAD HASIL (.WAV) ✅
                </a>
                <button
                  onClick={() => setFile(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff6b6b",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Ganti Video
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioStudio;
