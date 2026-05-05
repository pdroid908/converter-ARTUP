import React, { useState } from "react";

const TesConverter = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Siap");
  const [mp3Url, setMp3Url] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);

  // Fungsi Estimasi Ukuran File (Sesuai referensi AudioStudio)
  const getEstimateSize = () => {
    if (!duration) return "0 KB";
    const bitrate = 128; // kbps standar
    const sizeInBytes = (bitrate * 1000 * duration) / 8;
    return sizeInBytes < 1024 * 1024
      ? (sizeInBytes / 1024).toFixed(0) + " KB"
      : (sizeInBytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMp3Url(null);
      setProgress(0);
      setStatus("File siap dikonversi");

      // Ambil durasi audio untuk estimasi
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(selectedFile);
      audio.onloadedmetadata = () => setDuration(audio.duration);
    }
  };

  const convertWavToMp3 = async () => {
    if (!file || !window.lamejs) return;

    setIsProcessing(true);
    setStatus("Membaca data audio...");
    setProgress(5);

    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      setStatus("Proses encoding MP3...");

      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const mp3encoder = new window.lamejs.Mp3Encoder(
        channels,
        sampleRate,
        128,
      );
      const mp3Data = [];

      // Helper float ke Int16
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
          setProgress(Math.round((i / left.length) * 100));
          await new Promise((r) => setTimeout(r, 0)); // Mencegah UI Freeze
        }
      }

      const flush = mp3encoder.flush();
      if (flush.length > 0) mp3Data.push(flush);

      setMp3Url(URL.createObjectURL(new Blob(mp3Data, { type: "audio/mp3" })));
      setProgress(100);
      setStatus("Konversi Selesai!");
    } catch (error) {
      console.error(error);
      setStatus("Gagal memproses audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        color: "white",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(15px)",
          borderRadius: "30px",
          padding: "40px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <h2 style={{ color: "#f9d423", marginBottom: "10px" }}>ARTUP STUDIO</h2>
        <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
          Music Lab: WAV to MP3 Converter No Data Used
        </p>

        {!file ? (
          <div
            style={{
              border: "2px dashed #71b280",
              borderRadius: "20px",
              padding: "40px",
              marginTop: "30px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept=".wav"
              onChange={handleFileChange}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
              }}
            />
            <p style={{ fontSize: "2rem" }}>🎵</p>
            <p>Pilih file musik WAV untuk diconvert</p>
          </div>
        ) : (
          <div style={{ marginTop: "30px" }}>
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                padding: "20px",
                borderRadius: "20px",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontWeight: "bold" }}>📄 {file.name}</p>
              <p style={{ color: "#71b280", fontSize: "0.8rem" }}>
                Estimasi MP3: {getEstimateSize()}
              </p>

              {isProcessing && (
                <div style={{ marginTop: "15px" }}>
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
                  <p
                    style={{
                      fontSize: "0.7rem",
                      marginTop: "5px",
                      color: "#f9d423",
                    }}
                  >
                    {status} {progress}%
                  </p>
                </div>
              )}
            </div>

            {!mp3Url && !isProcessing && (
              <button
                onClick={convertWavToMp3}
                style={{
                  background: "#71b280",
                  color: "#0b2027",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                KONVERSI SEKARANG
              </button>
            )}

            {mp3Url && (
              <div style={{ animation: "fadeIn 0.5s" }}>
                <audio
                  src={mp3Url}
                  controls
                  style={{ width: "100%", marginBottom: "20px" }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  <a
                    href={mp3Url}
                    download="artup_converted.mp3"
                    style={{
                      background: "#28a745",
                      color: "white",
                      textDecoration: "none",
                      padding: "12px 25px",
                      borderRadius: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    Save mp3 now ✅
                  </a>
                  <button
                    onClick={() => setFile(null)}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                      border: "none",
                      padding: "12px 25px",
                      borderRadius: "10px",
                      cursor: "pointer",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TesConverter;
