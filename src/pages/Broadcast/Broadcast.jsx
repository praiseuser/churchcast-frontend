import { useState, useRef } from "react";
import { Room, RoomEvent } from "livekit-client";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";

export default function Broadcast() {
  const [roomName, setRoomName] = useState("sunday-service");
  const [name, setName] = useState("Phone");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("");
  const videoRef = useRef(null);
  const roomRef = useRef(null);

  const handleConnect = async () => {
    if (connecting || connected) return; // guard against double-clicks
    setConnecting(true);
    setStatus("Requesting token...");
    try {
      const res = await fetch(`/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName: name }),
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
      room.on(RoomEvent.Disconnected, () => setConnected(false));

      setStatus("Connecting to room...");
      await room.connect(url, token);

      setStatus("Requesting camera and microphone...");
      await room.localParticipant.enableCameraAndMicrophone();

      setConnected(true);
      setConnecting(false);
      setStatus("Live");
    } catch (err) {
      console.error("Broadcast connect error:", err);
      setConnecting(false);
      setStatus(`Failed: ${err.message || "unknown error"}`);
    }
  };

  const handleDisconnect = async () => {
    await roomRef.current?.disconnect();
    setConnected(false);
    setConnecting(false);
    setStatus("");
  };

  return (
    <Box sx={{ p: 4, maxWidth: 480, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontFamily: '"Newsreader", serif', mb: 2 }}>
        Broadcast (Phone)
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField label="Room Name" fullWidth margin="normal" value={roomName} onChange={(e) => setRoomName(e.target.value)} disabled={connected || connecting} />
        <TextField label="Your Name" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} disabled={connected || connecting} />
        {!connected ? (
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleConnect} disabled={connecting}>
            {connecting ? "Connecting..." : "Go Live"}
          </Button>
        ) : (
          <Button variant="outlined" fullWidth sx={{ mt: 2 }} color="error" onClick={handleDisconnect}>Stop</Button>
        )}
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>{status}</Typography>
      </Paper>

      <Box sx={{ aspectRatio: "16/9", bgcolor: "#000" }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
    </Box>
  );
}