import React, { useState, useEffect } from "react";

const AudioEnhancer = ({ onBack }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [multiplier, setMultiplier] = useState(1.5);
  const [format, setFormat] = useState("mp3"); // Default format
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Hitung estimasi ukuran file
  const getEstimation = () => {
    if (!duration) return "0 MB";
    if (format === "wav") {
      // Rumus WAV 16-bit Stereo: (SampleRate * 2 * 2 * durasi) / 1024 / 1024
      return ((44100 * 4 * duration) / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      // Estimasi MP3 128kbps: (128kbps * durasi) / 8 / 1024
      return ((128 * duration) / 8 / 1024).toFixed(1) + " MB";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setDownloadUrl(null);
      // Ambil durasi audio untuk estimasi
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => setDuration(audio.duration);
    }
  };

  const processAudio = async () => {
    if (!audioFile) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const inputBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const offlineCtx = new OfflineAudioContext(
        inputBuffer.numberOfChannels,
        inputBuffer.length,
        inputBuffer.sampleRate,
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = inputBuffer;

      // LOGIKA ENHANCER[cite: 3]
      const highPass = offlineCtx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 100;

      const clarity = offlineCtx.createBiquadFilter();
      clarity.type = "highshelf";
      clarity.frequency.value = 3000;
      // Sekarang: Multiplier berpengaruh ke ketajaman suara, bukan cuma volume
      clarity.gain.value = 6 * multiplier;

      const midBoost = offlineCtx.createBiquadFilter();
      midBoost.type = "peaking";
      midBoost.frequency.value = 1000;
      midBoost.gain.value = multiplier;

      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, offlineCtx.currentTime);
      compressor.ratio.setValueAtTime(12, offlineCtx.currentTime);

      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = multiplier;

      source.connect(highPass);
      highPass.connect(clarity);
      clarity.connect(midBoost); // Tambahan midBoost agar suara lebih "padat"[cite: 3]
      midBoost.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(offlineCtx.destination);

      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      // Logika Output Format[cite: 3]
      let finalBlob;
      if (format === "wav") {
        finalBlob = bufferToWav(renderedBuffer);
      } else {
        // Panggil fungsi mp3 yang baru dibuat
        finalBlob = bufferToMp3(renderedBuffer);
      }

      if (finalBlob) {
        setDownloadUrl(URL.createObjectURL(finalBlob));
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memproses.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper Buffer to WAV (Sama seperti kodemu)[cite: 3]
  const bufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArr = new ArrayBuffer(length),
      view = new DataView(bufferArr),
      channels = [];
    let i,
      sample,
      offset = 0,
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
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([bufferArr], { type: "audio/wav" });
  };

  const bufferToMp3 = (buffer) => {
    const lamejs = window.lamejs; // Mengambil library dari public/lame.min.js
    if (!lamejs) {
      alert("Library MP3 (lamejs) tidak ditemukan!");
      return null;
    }

    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128kbps untuk kejernihan
    const mp3Data = [];

    const samplesL = buffer.getChannelData(0);
    const samplesR = channels > 1 ? buffer.getChannelData(1) : samplesL;

    const floatToInt16 = (s) => {
      let v = Math.max(-1, Math.min(1, s));
      return v < 0 ? v * 0x8000 : v * 0x7fff;
    };

    const sampleBlockSize = 1152;
    for (let i = 0; i < samplesL.length; i += sampleBlockSize) {
      const leftChunk = new Int16Array(sampleBlockSize);
      const rightChunk = new Int16Array(sampleBlockSize);
      for (let j = 0; j < sampleBlockSize; j++) {
        if (i + j < samplesL.length) {
          leftChunk[j] = floatToInt16(samplesL[i + j]);
          rightChunk[j] = floatToInt16(samplesR[i + j]);
        }
      }
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }

    const lastBuf = mp3encoder.flush();
    if (lastBuf.length > 0) mp3Data.push(lastBuf);

    return new Blob(mp3Data, { type: "audio/mp3" });
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "30px",
        backgroundColor: "#111827",
        borderRadius: "20px",
        border: "1px solid #1f2937",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#38bdf8",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Kembali
      </button>

      <h2 style={{ color: "#38bdf8", textAlign: "center" }}>
        ✨ Audio Enhancer Pro
      </h2>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "2px dashed #374151",
          borderRadius: "15px",
          textAlign: "center",
          backgroundColor: "#1f2937",
        }}
      >
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        {audioFile && (
          <p style={{ color: "#10b981", marginTop: "10px" }}>
            📁 {audioFile.name}
          </p>
        )}
      </div>

      {audioFile && (
        <div style={{ marginTop: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            Pilih Format & Estimasi:
          </label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {["mp3", "wav"].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: format === f ? "#0ea5e9" : "#374151",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "15px",
              borderRadius: "10px",
              textAlign: "center",
              border: "1px solid #334155",
            }}
          >
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>
              Estimasi Ukuran Hasil:{" "}
            </span>
            <b style={{ color: "#fbbf24", fontSize: "18px" }}>
              {getEstimation()}
            </b>
          </div>

          <label
            style={{
              display: "block",
              marginTop: "20px",
              marginBottom: "10px",
            }}
          >
            Tingkat Pembesaran:
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            {[1.2, 1.5, 2.0, 3.0].map((v) => (
              <button
                key={v}
                onClick={() => setMultiplier(v)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: multiplier === v ? "#0ea5e9" : "#374151",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        disabled={!audioFile || isProcessing}
        onClick={processAudio}
        style={{
          width: "100%",
          marginTop: "30px",
          padding: "15px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: isProcessing ? "#64748b" : "#0ea5e9",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {isProcessing ? "🔄 Sedang Menghitung..." : "🔥 Jernihkan & Simpan"}
      </button>

      {downloadUrl && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#064e3b",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <a
            href={downloadUrl}
            download={`ARTUP_Enhanced.${format}`}
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Download Hasil ({format.toUpperCase()})
          </a>
        </div>
      )}
    </div>
  );
};

export default AudioEnhancer;
