import { useState, useRef, useEffect } from "react";
import { Room, RoomEvent } from "livekit-client";
import { Box, Typography, TextField, Button, Paper, Chip } from "@mui/material";

export default function Viewer() {
    const [roomName, setRoomName] = useState("");
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState("");
    const [activeSpeakerName, setActiveSpeakerName] = useState("");
    const videoRef = useRef(null);
    const audioRefs = useRef({});
    const roomRef = useRef(null);
    const tracksRef = useRef([]);
    const switchIntervalRef = useRef(null);
    const currentIndexRef = useRef(0);

    const showNextFeed = () => {
        const tracks = tracksRef.current;
        if (!tracks.length || !videoRef.current) return;
        currentIndexRef.current = (currentIndexRef.current + 1) % tracks.length;
        const next = tracks[currentIndexRef.current];
        next.track.attach(videoRef.current);
        setActiveSpeakerName(next.participantName);
    };

    const handleConnect = async () => {
        if (!roomName.trim()) {
            setStatus("Enter a recording ID first");
            return;
        }
        setStatus("Requesting token...");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("churchcast_token")}`,
                },
                body: JSON.stringify({ roomName, participantName: "Laptop-Viewer" }),
            });
            if (!res.ok) throw new Error(`Token request failed with ${res.status}`);
            const { token, url } = await res.json();

            const room = new Room();
            roomRef.current = room;

            room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === "video") {
                    tracksRef.current.push({ participantName: participant.identity, track });
                    if (tracksRef.current.length === 1) {
                        track.attach(videoRef.current);
                        setActiveSpeakerName(participant.identity);
                    }
                }
                if (track.kind === "audio") {
                    const audioEl = document.createElement("audio");
                    audioEl.autoplay = true;
                    track.attach(audioEl);
                    audioRefs.current[participant.identity] = audioEl;
                    document.body.appendChild(audioEl);
                }
            });

            room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                tracksRef.current = tracksRef.current.filter((t) => t.track !== track);
                if (track.kind === "audio" && audioRefs.current[participant.identity]) {
                    audioRefs.current[participant.identity].remove();
                    delete audioRefs.current[participant.identity];
                }
            });

            room.on(RoomEvent.Disconnected, () => setConnected(false));

            setStatus("Connecting...");
            await room.connect(url, token);

            setConnected(true);
            setStatus("Watching live");

            switchIntervalRef.current = setInterval(showNextFeed, 5000);
        } catch (err) {
            console.error(err);
            setStatus(`Failed to connect: ${err.message}`);
        }
    };

    const handleDisconnect = async () => {
        clearInterval(switchIntervalRef.current);
        await roomRef.current?.disconnect();
        tracksRef.current = [];
        Object.values(audioRefs.current).forEach((el) => el.remove());
        audioRefs.current = {};
        setConnected(false);
        setStatus("");
    };

    useEffect(() => {
        return () => clearInterval(switchIntervalRef.current);
    }, []);

    return (
        <Box sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
            <Typography variant="h5" sx={{ fontFamily: '"Newsreader", serif', mb: 2 }}>
                Viewer (Laptop)
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <TextField
                    label="Recording ID"
                    fullWidth
                    margin="normal"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    disabled={connected}
                />
                {!connected ? (
                    <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleConnect}>
                        Watch Live
                    </Button>
                ) : (
                    <Button variant="outlined" fullWidth sx={{ mt: 2 }} color="error" onClick={handleDisconnect}>
                        Stop Watching
                    </Button>
                )}
                <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
                    {status}
                </Typography>
            </Paper>

            <Box sx={{ position: "relative", aspectRatio: "16/9", bgcolor: "#000" }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {connected && activeSpeakerName && (
                    <Chip
                        label={activeSpeakerName}
                        size="small"
                        sx={{ position: "absolute", bottom: 12, left: 12, bgcolor: "rgba(0,0,0,0.6)", color: "#fff" }}
                    />
                )}
            </Box>
        </Box>
    );
}