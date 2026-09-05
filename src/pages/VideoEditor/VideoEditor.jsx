import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
  CircularProgress,
  TextField,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import MicIcon from "@mui/icons-material/Mic";
import TuneIcon from "@mui/icons-material/Tune";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VolumeSlider from "../../components/VolumeSlider";
import InstrumentalPanel from "../../components/InstrumentalPanel";
import VisualEffectsPanel, { FILTER_PRESETS } from "../../components/VisualEffectsPanel";
import { getRecording, exportRecording } from "../../api/recordings";

function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}

export default function VideoEditor() {
  const { id } = useParams();
  const videoRef = useRef(null);

  const audioCtxRef = useRef(null);
  const pastorGainRef = useRef(null);
  const masterGainRef = useRef(null);

  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [trimRange, setTrimRange] = useState([0, 0]);

  const [pastorMic, setPastorMic] = useState(85);
  const [master, setMaster] = useState(90);

  const [brandingEnabled, setBrandingEnabled] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);

  const [selectedFilter, setSelectedFilter] = useState("natural");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vignette, setVignette] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  const [messageTitle, setMessageTitle] = useState("");
  const [preacherName, setPreacherName] = useState("");

  useEffect(() => {
    getRecording(id)
      .then((data) => {
        setRecording(data);
        setMessageTitle(data.title);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load this recording.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const ensureAudioGraph = () => {
    if (audioCtxRef.current || !videoRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(videoRef.current);

      const pastorGain = ctx.createGain();
      pastorGain.gain.value = pastorMic / 100;

      const masterGain = ctx.createGain();
      masterGain.gain.value = master / 100;

      source.connect(pastorGain);
      pastorGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      pastorGainRef.current = pastorGain;
      masterGainRef.current = masterGain;
    } catch (err) {
      console.error("Could not set up audio graph:", err);
    }
  };

  const handleFilterSelect = (filterId) => {
    const preset = FILTER_PRESETS[filterId];
    setSelectedFilter(filterId);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturate);
  };

  const activePreset = FILTER_PRESETS[selectedFilter];
  const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${activePreset.sepia}%) hue-rotate(${activePreset.hue}deg) grayscale(${activePreset.grayscale}%)`;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    ensureAudioGraph();
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < trimRange[0] || video.currentTime >= trimRange[1]) {
        video.currentTime = trimRange[0];
      }
      video.play();
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setTrimRange([0, video.duration]);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlayhead(video.currentTime);

    if (video.currentTime >= trimRange[1]) {
      video.pause();
      video.currentTime = trimRange[0];
    }
  };

  const handleTrimChange = (val) => {
    setTrimRange(val);
    const video = videoRef.current;
    if (video && (video.currentTime < val[0] || video.currentTime > val[1])) {
      video.currentTime = val[0];
    }
  };

  const handlePastorMicChange = (val) => {
    setPastorMic(val);
    if (pastorGainRef.current) pastorGainRef.current.gain.value = val / 100;
  };

  const handleMasterChange = (val) => {
    setMaster(val);
    if (masterGainRef.current) masterGainRef.current.gain.value = val / 100;
  };

  const handleExport = async (format) => {
    setExporting(true);
    setExportUrl("");
    try {
      const result = await exportRecording(id, {
        trimStart: trimRange[0],
        trimEnd: trimRange[1],
        pastorMicVolume: pastorMic,
        masterVolume: master,
        format,
      });
      setExportUrl(result.downloadUrl);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Check the console for details.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!exportUrl) return;
    setDownloading(true);
    const ext = exportUrl.split(".").pop().split("?")[0];
    const baseName = sanitizeFilename(
      `${messageTitle || recording.title}${preacherName ? " - " + preacherName : ""}`
    );
    const filename = `${baseName}.${ext}`;

    try {
      const res = await fetch(exportUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, opening in new tab instead:", err);
      window.open(exportUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mx: -4, my: -4, p: 4, minHeight: "100vh", bgcolor: "#0B0F1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#E2A33E" }} />
      </Box>
    );
  }

  if (error || !recording) {
    return (
      <Box sx={{ mx: -4, my: -4, p: 4, minHeight: "100vh", bgcolor: "#0B0F1A", color: "#EDEFF4" }}>
        <Typography>{error || "Recording not found."}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mx: -4,
        my: -4,
        p: 4,
        minHeight: "100vh",
        bgcolor: "#0B0F1A",
        color: "#EDEFF4",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: '"Newsreader", serif' }}>
            {recording.title} — Edit
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.55)" }}>
            {new Date(recording.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {duration > 0 && ` · ${formatTime(duration)} original length`}
          </Typography>
        </Box>
      </Box>

      {/* Export details */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "flex-end",
          mb: 4,
          p: 2.5,
          bgcolor: "rgba(237,239,244,0.03)",
          border: "1px solid rgba(237,239,244,0.1)",
        }}
      >
        <TextField
          label="Message Title"
          placeholder="e.g. God Is Love"
          value={messageTitle}
          onChange={(e) => setMessageTitle(e.target.value)}
          size="small"
          sx={{
            minWidth: 220,
            "& .MuiOutlinedInput-root": { color: "#EDEFF4" },
            "& .MuiInputLabel-root": { color: "rgba(237,239,244,0.5)" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(237,239,244,0.2)" },
          }}
        />
        <TextField
          label="Preacher Name"
          placeholder="e.g. Pastor Chukwuemeka Nwachukwu"
          value={preacherName}
          onChange={(e) => setPreacherName(e.target.value)}
          size="small"
          sx={{
            minWidth: 260,
            "& .MuiOutlinedInput-root": { color: "#EDEFF4" },
            "& .MuiInputLabel-root": { color: "rgba(237,239,244,0.5)" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(237,239,244,0.2)" },
          }}
        />

        <Box sx={{ display: "flex", gap: 1.5, ml: "auto", flexWrap: "wrap" }}>
          {exportUrl && (
            <Button
              variant="outlined"
              onClick={handleDownload}
              disabled={downloading}
              sx={{ borderColor: "secondary.main", color: "secondary.main" }}
            >
              {downloading ? "Preparing..." : "Download Ready"}
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => handleExport("audio")}
            disabled={exporting}
            sx={{ borderColor: "rgba(237,239,244,0.3)", color: "#EDEFF4" }}
          >
            {exporting ? "Processing..." : "Export Audio"}
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleExport("video")}
            disabled={exporting}
            sx={{
              bgcolor: "#E2A33E",
              color: "#1B2230",
              fontWeight: 600,
              px: 3,
              py: 1.2,
              "&:hover": { bgcolor: "#c98f2f" },
            }}
          >
            {exporting ? "Processing..." : "Export Video"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {/* Preview + timeline */}
        <Box sx={{ flex: 2, minWidth: 340 }}>
          <Box
            sx={{
              aspectRatio: "16 / 9",
              bgcolor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={togglePlay}
          >
            {recording.videoUrl ? (
              <video
                ref={videoRef}
                src={recording.videoUrl}
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterString }}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <Typography sx={{ color: "rgba(237,239,244,0.4)" }}>
                Video is still processing — check back shortly.
              </Typography>
            )}

            {vignette && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  boxShadow: "inset 0 0 140px 40px rgba(0,0,0,0.75)",
                  pointerEvents: "none",
                }}
              />
            )}

            {recording.videoUrl && (
              <IconButton
                sx={{
                  position: "absolute",
                  width: 64,
                  height: 64,
                  bgcolor: "rgba(237,239,244,0.12)",
                  "&:hover": { bgcolor: "rgba(237,239,244,0.2)" },
                }}
              >
                {isPlaying ? (
                  <PauseIcon sx={{ color: "#fff", fontSize: 30 }} />
                ) : (
                  <PlayArrowIcon sx={{ color: "#fff", fontSize: 30 }} />
                )}
              </IconButton>
            )}

            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                bottom: 12,
                right: 16,
                color: "rgba(237,239,244,0.6)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(playhead)} / {formatTime(duration)}
            </Typography>
          </Box>

          {/* Timeline */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.55)", mb: 1 }}>
              Trim — preview plays only between these points
            </Typography>
            <Slider
              value={trimRange}
              onChange={(e, val) => handleTrimChange(val)}
              min={0}
              max={duration || 1}
              disableSwap
              sx={{
                color: "#E2A33E",
                height: 6,
                "& .MuiSlider-thumb": { width: 6, height: 22, borderRadius: 1, bgcolor: "#E2A33E" },
                "& .MuiSlider-track": { bgcolor: "#E2A33E", border: "none" },
                "& .MuiSlider-rail": { bgcolor: "rgba(237,239,244,0.15)" },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.45)" }}>
                In: {formatTime(trimRange[0])}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.45)" }}>
                Out: {formatTime(trimRange[1])}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(237,239,244,0.1)" }}>
            <VisualEffectsPanel
              selectedPreset={selectedFilter}
              onPresetSelect={handleFilterSelect}
              brightness={brightness}
              contrast={contrast}
              saturation={saturation}
              onBrightnessChange={setBrightness}
              onContrastChange={setContrast}
              onSaturationChange={setSaturation}
              vignette={vignette}
              onVignetteToggle={setVignette}
            />
          </Box>
        </Box>

        {/* Audio mixer + instrumental + branding panel */}
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <Typography variant="overline" sx={{ color: "rgba(237,239,244,0.45)", letterSpacing: 1, fontSize: 11 }}>
            Original Recording
          </Typography>

          <Box sx={{ mt: 2 }}>
            <VolumeSlider
              label="Pastor Mic"
              value={pastorMic}
              onChange={handlePastorMicChange}
              icon={<MicIcon sx={{ fontSize: 16, color: "rgba(237,239,244,0.5)" }} />}
            />
            <VolumeSlider
              label="Master Volume"
              value={master}
              onChange={handleMasterChange}
              icon={<TuneIcon sx={{ fontSize: 16, color: "rgba(237,239,244,0.5)" }} />}
            />
          </Box>

          <Box sx={{ mt: 2, pt: 3, borderTop: "1px solid rgba(237,239,244,0.1)" }}>
            <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.45)", display: "block", mb: 1.5 }}>
              Add background music or a keyboard pad below — this plays alongside the recording.
            </Typography>
            <InstrumentalPanel />
          </Box>

          <Box sx={{ mt: 2, pt: 3, borderTop: "1px solid rgba(237,239,244,0.1)" }}>
            <Typography variant="overline" sx={{ color: "rgba(237,239,244,0.45)", letterSpacing: 1, fontSize: 11 }}>
              Enhancements
            </Typography>

            <FormControlLabel
              sx={{ display: "flex", justifyContent: "space-between", ml: 0, mt: 1.5, width: "100%" }}
              labelPlacement="start"
              control={
                <Switch
                  checked={noiseReduction}
                  onChange={(e) => setNoiseReduction(e.target.checked)}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#E2A33E" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#E2A33E" } }}
                />
              }
              label={<Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>Noise Reduction</Typography>}
            />
            <FormControlLabel
              sx={{ display: "flex", justifyContent: "space-between", ml: 0, width: "100%" }}
              labelPlacement="start"
              control={
                <Switch
                  checked={brandingEnabled}
                  onChange={(e) => setBrandingEnabled(e.target.checked)}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#E2A33E" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#E2A33E" } }}
                />
              }
              label={<Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>Church Branding Overlay</Typography>}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}