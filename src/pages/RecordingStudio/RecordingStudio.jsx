import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Room, RoomEvent } from "livekit-client";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Switch,
  FormControlLabel,
  Slider,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import LevelMeter from "../../components/LevelMeter";
import useAuthStore from "../../context/authStore";
import { startEgress, stopEgress } from "../../api/egress";

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordingStudio() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);

  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunkQueueRef = useRef(Promise.resolve());

  const [cameraError, setCameraError] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("Ready to record");
  const [seconds, setSeconds] = useState(0);

  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [streamToFacebook, setStreamToFacebook] = useState(false);

  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
  const [zoom, setZoom] = useState(1);
  const videoTrackRef = useRef(null);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      clearInterval(timerRef.current);
    };
  }, []);

  const refreshAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "audioinput");
      setAudioDevices(inputs);
      if (inputs.length && !selectedAudioDevice) {
        setSelectedAudioDevice(inputs[0].deviceId);
      }
    } catch (err) {
      console.error("Could not list audio devices:", err);
    }
  };

  const checkZoomSupport = (localVideoTrack) => {
    try {
      const mediaTrack = localVideoTrack.mediaStreamTrack;
      const capabilities = mediaTrack.getCapabilities?.();
      if (capabilities?.zoom) {
        setZoomSupported(true);
        setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step || 0.1 });
        setZoom(capabilities.zoom.min);
      }
    } catch (err) {
      console.error("Zoom not supported:", err);
    }
  };

  const handleZoomChange = async (value) => {
    setZoom(value);
    const track = videoTrackRef.current?.mediaStreamTrack;
    if (track) {
      try {
        await track.applyConstraints({ advanced: [{ zoom: value }] });
      } catch (err) {
        console.error("Could not apply zoom:", err);
      }
    }
  };

  const uploadChunk = async (blob) => {
    const formData = new FormData();
    formData.append("chunk", blob, `${id}.webm`);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ""}/recordings/${id}/chunk`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("churchcast_token")}` },
        body: formData,
      });
    } catch (err) {
      console.error("Chunk upload failed:", err);
    }
  };

  const startLocalRecording = (room) => {
    const videoPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
    const audioPub = Array.from(room.localParticipant.audioTrackPublications.values())[0];
    const tracks = [];
    if (videoPub?.track?.mediaStreamTrack) tracks.push(videoPub.track.mediaStreamTrack);
    if (audioPub?.track?.mediaStreamTrack) tracks.push(audioPub.track.mediaStreamTrack);
    if (!tracks.length) return;

    const combinedStream = new MediaStream(tracks);
    const recorder = new MediaRecorder(combinedStream, { mimeType: "video/webm;codecs=vp8,opus" });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunkQueueRef.current = chunkQueueRef.current.then(() => uploadChunk(e.data));
      }
    };

    recorder.start(10000); // sends a piece to the server every 10 seconds
    mediaRecorderRef.current = recorder;
  };

  const handleGoLive = async () => {
    setConnecting(true);
    setStatus("Requesting access token...");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("churchcast_token")}`,
        },
        body: JSON.stringify({ roomName: id, participantName: user?.name || "Media Team" }),
      });
      if (!res.ok) throw new Error(`Token server responded with ${res.status}`);
      const { token, url } = await res.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.track?.kind === "video" && videoRef.current) {
          publication.track.attach(videoRef.current);
          videoTrackRef.current = publication.track;
          checkZoomSupport(publication.track);
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        setIsLive(false);
        setIsPaused(false);
        clearInterval(timerRef.current);
      });

      setStatus("Connecting to room...");
      await room.connect(url, token);

      setStatus("Publishing camera and microphone...");
      try {
        await room.localParticipant.setCameraEnabled(true, { facingMode: "environment" });
        await room.localParticipant.setMicrophoneEnabled(true);
        setCameraError(false);
        startLocalRecording(room);
      } catch (mediaErr) {
        console.error("Camera/mic error:", mediaErr);
        setCameraError(true);
      }

      await refreshAudioDevices();

      try {
        await startEgress(id, { streamToFacebook });
      } catch (err) {
        console.error("Could not start Facebook stream:", err);
      }

      setIsLive(true);
      setConnecting(false);
      setStatus("Live — Recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Go live error:", err);
      setConnecting(false);
      setStatus(`Failed: ${err.message || "unknown error"}`);
    }
  };

  const handleTogglePause = async () => {
    const room = roomRef.current;
    if (!room) return;
    const nextPaused = !isPaused;
    await room.localParticipant.setCameraEnabled(!nextPaused);
    await room.localParticipant.setMicrophoneEnabled(!nextPaused);
    setIsPaused(nextPaused);
    setStatus(nextPaused ? "Paused" : "Live — Recording");
  };

  const handleStop = async () => {
    setStatus("Finishing recording...");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = resolve;
        mediaRecorderRef.current.stop();
      });
    }

    await chunkQueueRef.current;

    try {
      await stopEgress(id);
    } catch (err) {
      console.error("Could not stop Facebook stream:", err);
    }

    await roomRef.current?.disconnect();
    clearInterval(timerRef.current);
    setIsLive(false);
    setIsPaused(false);

    setStatus("Finalizing recording on server — do not close this page...");
    try {
      const finalizeRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/recordings/${id}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("churchcast_token")}` },
      });
      if (!finalizeRes.ok) throw new Error(`Finalize failed with ${finalizeRes.status}`);
      const result = await finalizeRes.json();
      console.log("Recording saved:", result);
      setStatus("Recording saved!");
    } catch (err) {
      console.error("Finalize failed:", err);
      setStatus("Upload finished, finalizing failed — your recording is safe on the server, contact support to recover it");
    }

    setSeconds(0);
  };

  const handleAudioDeviceChange = async (deviceId) => {
    setSelectedAudioDevice(deviceId);
    if (roomRef.current && isLive) {
      try {
        await roomRef.current.switchActiveDevice("audioinput", deviceId);
      } catch (err) {
        console.error("Could not switch audio device:", err);
      }
    }
  };

  return (
    <Box sx={{ mx: -4, my: -4, p: 4, minHeight: "100vh", bgcolor: "#0B0F1A", color: "#EDEFF4" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: '"Newsreader", serif' }}>
            Recording Studio
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.55)" }}>
            Recording ID: {id} · {status}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isLive && (
            <Box
              sx={{
                width: 9, height: 9, borderRadius: "50%", bgcolor: "#C6432B",
                animation: isPaused ? "none" : "pulse 1.2s infinite",
                "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
              }}
            />
          )}
          <Typography sx={{ fontFamily: '"Newsreader", serif', fontSize: 22, fontVariantNumeric: "tabular-nums", color: isLive ? "#FFFFFF" : "rgba(237,239,244,0.4)" }}>
            {formatTime(seconds)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <Box sx={{ flex: 2, minWidth: 320, position: "relative", aspectRatio: "16 / 9", bgcolor: "#000", overflow: "hidden" }}>
          {!cameraError ? (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", px: 3 }}>
              <Typography sx={{ color: "rgba(237,239,244,0.4)" }}>
                No camera detected on this device.
              </Typography>
            </Box>
          )}

          {zoomSupported && (
            <Box sx={{ position: "absolute", bottom: 14, left: 14, right: 14, display: "flex", alignItems: "center", gap: 1, bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2, px: 1.5, py: 0.5 }}>
              <ZoomInIcon sx={{ color: "#fff", fontSize: 18 }} />
              <Slider value={zoom} min={zoomRange.min} max={zoomRange.max} step={zoomRange.step} onChange={(e, val) => handleZoomChange(val)} size="small" sx={{ color: "#E2A33E", "& .MuiSlider-thumb": { width: 14, height: 14 } }} />
            </Box>
          )}

          {[
            { top: 14, left: 14, borderTop: "2px solid", borderLeft: "2px solid" },
            { top: 14, right: 14, borderTop: "2px solid", borderRight: "2px solid" },
            { bottom: 14, left: 14, borderBottom: "2px solid", borderLeft: "2px solid" },
            { bottom: 14, right: 14, borderBottom: "2px solid", borderRight: "2px solid" },
          ].map((pos, i) => (
            <Box key={i} sx={{ position: "absolute", width: 22, height: 22, borderColor: "rgba(226,163,62,0.8)", ...pos }} />
          ))}
        </Box>

        <Box sx={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: "rgba(237,239,244,0.55)" }}>Audio Source</InputLabel>
            <Select value={selectedAudioDevice} label="Audio Source" onChange={(e) => handleAudioDeviceChange(e.target.value)} sx={{ color: "#EDEFF4", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(237,239,244,0.2)" } }}>
              {audioDevices.length === 0 && <MenuItem value=""><em>Go live to detect microphones</em></MenuItem>}
              {audioDevices.map((d) => <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || "Microphone"}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={streamToFacebook} onChange={(e) => setStreamToFacebook(e.target.checked)} disabled={isLive} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#1877F2" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1877F2" } }} />}
            label={<Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>Also go live on Facebook</Typography>}
          />

          <Box>
            <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.55)", mb: 1.5 }}>Microphone Level</Typography>
            <LevelMeter active={isLive && !isPaused} />
          </Box>

          <Box sx={{ mt: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            {!isLive ? (
              <IconButton onClick={handleGoLive} disabled={connecting} sx={{ width: 68, height: 68, bgcolor: "#C6432B", "&:hover": { bgcolor: "#a8371f" } }}>
                <FiberManualRecordIcon sx={{ color: "#fff", fontSize: 30 }} />
              </IconButton>
            ) : (
              <>
                <IconButton onClick={handleTogglePause} sx={{ width: 56, height: 56, bgcolor: "rgba(237,239,244,0.1)" }}>
                  {isPaused ? <PlayArrowIcon sx={{ color: "#fff" }} /> : <PauseIcon sx={{ color: "#fff" }} />}
                </IconButton>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    onClick={handleStop}
                    sx={{ width: 56, height: 56, bgcolor: "rgba(237,239,244,0.1)" }}
                  >
                    <StopIcon sx={{ color: "#fff" }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>
                    Finish
                  </Typography>
                </Box>
              </>
            )}
            <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.5)" }}>
              {connecting ? "Connecting..." : status}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}