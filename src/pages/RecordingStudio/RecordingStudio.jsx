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
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
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

  const [cameraError, setCameraError] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("Ready to record");
  const [seconds, setSeconds] = useState(0);

  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");

  const [streamToFacebook, setStreamToFacebook] = useState(false);

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
        body: JSON.stringify({
          roomName: id,
          participantName: user?.name || "Media Team",
        }),
      });
      if (!res.ok) throw new Error(`Token server responded with ${res.status}`);
      const { token, url } = await res.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.track && publication.track.kind === "video" && videoRef.current) {
          publication.track.attach(videoRef.current);
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
        await room.localParticipant.enableCameraAndMicrophone();
        setCameraError(false);
      } catch (mediaErr) {
        console.error("Camera/mic error:", mediaErr);
        setCameraError(true);
      }

      await refreshAudioDevices();

      try {
        const result = await startEgress(id, { streamToFacebook });
        console.log("Recording started saving to storage", result);
      } catch (err) {
        console.error("Could not start server-side recording:", err);
      }

      setIsLive(true);
      setConnecting(false);
      setStatus("Live");
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
    setStatus(nextPaused ? "Paused" : "Live");
  };

  const handleStop = async () => {
    try {
      const result = await stopEgress(id);
      console.log("Recording saved:", result);
    } catch (err) {
      console.error("Could not stop server-side recording:", err);
    }
    await roomRef.current?.disconnect();
    clearInterval(timerRef.current);
    setIsLive(false);
    setIsPaused(false);
    setSeconds(0);
    setStatus("Ready to record");
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
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: "#C6432B",
                animation: isPaused ? "none" : "pulse 1.2s infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.3 },
                },
              }}
            />
          )}
          <Typography
            sx={{
              fontFamily: '"Newsreader", serif',
              fontSize: 22,
              fontVariantNumeric: "tabular-nums",
              color: isLive ? "#FFFFFF" : "rgba(237,239,244,0.4)",
            }}
          >
            {formatTime(seconds)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {/* Camera viewfinder */}
        <Box
          sx={{
            flex: 2,
            minWidth: 320,
            position: "relative",
            aspectRatio: "16 / 9",
            bgcolor: "#000",
            overflow: "hidden",
          }}
        >
          {!cameraError ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 3,
              }}
            >
              <Typography sx={{ color: "rgba(237,239,244,0.4)" }}>
                No camera detected on this device — mic-only publish still works.
                Open this page on the phone to broadcast video.
              </Typography>
            </Box>
          )}

          {[
            { top: 14, left: 14, borderTop: "2px solid", borderLeft: "2px solid" },
            { top: 14, right: 14, borderTop: "2px solid", borderRight: "2px solid" },
            { bottom: 14, left: 14, borderBottom: "2px solid", borderLeft: "2px solid" },
            { bottom: 14, right: 14, borderBottom: "2px solid", borderRight: "2px solid" },
          ].map((pos, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                width: 22,
                height: 22,
                borderColor: "rgba(226,163,62,0.8)",
                ...pos,
              }}
            />
          ))}
        </Box>

        {/* Control panel */}
        <Box sx={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: "rgba(237,239,244,0.55)" }}>Audio Source</InputLabel>
            <Select
              value={selectedAudioDevice}
              label="Audio Source"
              onChange={(e) => handleAudioDeviceChange(e.target.value)}
              sx={{
                color: "#EDEFF4",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(237,239,244,0.2)" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(237,239,244,0.4)" },
              }}
            >
              {audioDevices.length === 0 && (
                <MenuItem value="">
                  <em>Go live to detect microphones</em>
                </MenuItem>
              )}
              {audioDevices.map((d) => (
                <MenuItem key={d.deviceId} value={d.deviceId}>
                  {d.label || "Microphone"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={streamToFacebook}
                onChange={(e) => setStreamToFacebook(e.target.checked)}
                disabled={isLive}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#1877F2" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1877F2" },
                }}
              />
            }
            label={<Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>Also go live on Facebook</Typography>}
          />

          <Box>
            <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.55)", mb: 1.5 }}>
              Microphone Level
            </Typography>
            <LevelMeter active={isLive && !isPaused} />
          </Box>

          <Box sx={{ mt: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            {!isLive ? (
              <IconButton
                onClick={handleGoLive}
                disabled={connecting}
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: "#C6432B",
                  "&:hover": { bgcolor: "#a8371f" },
                }}
              >
                <FiberManualRecordIcon sx={{ color: "#fff", fontSize: 30 }} />
              </IconButton>
            ) : (
              <>
                <IconButton
                  onClick={handleTogglePause}
                  sx={{ width: 56, height: 56, bgcolor: "rgba(237,239,244,0.1)" }}
                >
                  {isPaused ? <PlayArrowIcon sx={{ color: "#fff" }} /> : <PauseIcon sx={{ color: "#fff" }} />}
                </IconButton>
                <IconButton
                  onClick={handleStop}
                  sx={{ width: 56, height: 56, bgcolor: "rgba(237,239,244,0.1)" }}
                >
                  <StopIcon sx={{ color: "#fff" }} />
                </IconButton>
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