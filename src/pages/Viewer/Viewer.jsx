import { useState, useRef } from "react";
import { Room, RoomEvent } from "livekit-client";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";

const TOKEN_SERVER_URL = import.meta.env.VITE_TOKEN_SERVER_URL || "http://localhost:4001";

export default function Viewer() {
    const [roomName, setRoomName] = useState("sunday-service");
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState("");
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const roomRef = useRef(null);

    const handleConnect = async () => {
        setStatus("Requesting token...");
        try {
            const res = await fetch(`${TOKEN_SERVER_URL}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomName, participantName: "Laptop-Viewer" }),
            });
            const { token, url } = await res.json();

            const room = new Room();
            roomRef.current = room;

            room.on(RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === "video" && videoRef.current) track.attach(videoRef.current);
                if (track.kind === "audio" && audioRef.current) track.attach(audioRef.current);
            });
            room.on(RoomEvent.Disconnected, () => setConnected(false));

            setStatus("Connecting...");
            await room.connect(url, token);

            setConnected(true);
            setStatus("Watching live");
        } catch (err) {
            console.error(err);
            setStatus("Failed to connect — check token server and LiveKit credentials");
        }
    };

    const handleDisconnect = async () => {
        await roomRef.current?.disconnect();
        setConnected(false);
        setStatus("");
    };

    return (
        <Box sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
            <Typography variant="h5" sx={{ fontFamily: '"Newsreader", serif', mb: 2 }}>
                Viewer (Laptop)
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <TextField label="Room Name" fullWidth margin="normal" value={roomName} onChange={(e) => setRoomName(e.target.value)} disabled={connected} />
                {!connected ? (
                    <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleConnect}>Watch Live</Button>
                ) : (
                    <Button variant="outlined" fullWidth sx={{ mt: 2 }} color="error" onClick={handleDisconnect}>Stop Watching</Button>
                )}
                <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>{status}</Typography>
            </Paper>

            <Box sx={{ aspectRatio: "16/9", bgcolor: "#000" }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <audio ref={audioRef} autoPlay />
        </Box>
    );
}