import { useRef, useState } from "react";
import { Box, Typography, IconButton, Slider, Button, Stack } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";

function playWhoosh(ctx, gainNode) {
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.35);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.6);

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, ctx.currentTime);
    envelope.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
    envelope.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(gainNode);

    noise.start();
    noise.stop(ctx.currentTime + 0.6);
}

function playDing(ctx, gainNode) {
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;

        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(i === 0 ? 0.6 : 0.3, now + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc.connect(envelope);
        envelope.connect(gainNode);

        osc.start(now);
        osc.stop(now + 1.4);
    });
}

const BUILT_IN_EFFECTS = [
    { id: "whoosh", label: "Whoosh Transition", play: playWhoosh },
    { id: "ding", label: "Alert Ding", play: playDing },
];

export default function SoundboardPanel() {
    const audioCtxRef = useRef(null);
    const masterGainRef = useRef(null);
    const [masterVolume, setMasterVolume] = useState(70);
    const [customSounds, setCustomSounds] = useState([]);

    const getContext = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const masterGain = ctx.createGain();
            masterGain.gain.value = masterVolume / 100;
            masterGain.connect(ctx.destination);
            audioCtxRef.current = ctx;
            masterGainRef.current = masterGain;
        }
        if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
        return audioCtxRef.current;
    };

    const handleMasterVolumeChange = (val) => {
        setMasterVolume(val);
        if (masterGainRef.current) masterGainRef.current.gain.value = val / 100;
    };

    const handlePlayBuiltIn = (effect) => {
        const ctx = getContext();
        effect.play(ctx, masterGainRef.current);
    };

    const handlePlayCustom = (sound) => {
        const ctx = getContext();
        const source = ctx.createBufferSource();
        source.buffer = sound.audioBuffer;
        source.connect(masterGainRef.current);
        source.start();
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ctx = getContext();
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            setCustomSounds((prev) => [
                ...prev,
                { id: `${Date.now()}`, name: file.name.replace(/\.[^/.]+$/, ""), audioBuffer },
            ]);
        } catch (err) {
            console.error("Could not decode audio file:", err);
            alert("Could not load that sound file — try MP3, WAV, or M4A.");
        }
        e.target.value = "";
    };

    return (
        <Box>
            <Typography variant="overline" sx={{ color: "rgba(237,239,244,0.45)", letterSpacing: 1, fontSize: 11 }}>
                Sound Effects
            </Typography>

            <Box sx={{ mt: 1.5, mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>Master Volume</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>{masterVolume}%</Typography>
                </Box>
                <Slider
                    value={masterVolume}
                    onChange={(e, val) => handleMasterVolumeChange(val)}
                    size="small"
                    sx={{ color: "#E2A33E", "& .MuiSlider-thumb": { width: 12, height: 12 }, "& .MuiSlider-rail": { bgcolor: "rgba(237,239,244,0.15)" } }}
                />
            </Box>

            <Stack spacing={0.8} sx={{ mb: 2 }}>
                {BUILT_IN_EFFECTS.map((effect) => (
                    <Box
                        key={effect.id}
                        onClick={() => handlePlayBuiltIn(effect)}
                        sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, py: 1, borderRadius: 1, cursor: "pointer", bgcolor: "rgba(237,239,244,0.04)", "&:hover": { bgcolor: "rgba(226,163,62,0.1)" } }}
                    >
                        <IconButton size="small" sx={{ p: 0.3, color: "secondary.main" }}><PlayArrowIcon fontSize="small" /></IconButton>
                        <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.85)" }}>{effect.label}</Typography>
                    </Box>
                ))}

                {customSounds.map((sound) => (
                    <Box
                        key={sound.id}
                        onClick={() => handlePlayCustom(sound)}
                        sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, py: 1, borderRadius: 1, cursor: "pointer", bgcolor: "rgba(237,239,244,0.04)", "&:hover": { bgcolor: "rgba(226,163,62,0.1)" } }}
                    >
                        <IconButton size="small" sx={{ p: 0.3, color: "secondary.main" }}><PlayArrowIcon fontSize="small" /></IconButton>
                        <GraphicEqIcon sx={{ fontSize: 15, color: "rgba(237,239,244,0.4)" }} />
                        <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.85)" }} noWrap>{sound.name}</Typography>
                    </Box>
                ))}
            </Stack>

            <Button
                component="label"
                size="small"
                startIcon={<UploadFileIcon />}
                sx={{ color: "rgba(237,239,244,0.7)", border: "1px dashed rgba(237,239,244,0.25)", width: "100%", justifyContent: "flex-start" }}
            >
                Add Custom Sound (Airhorn, Applause, etc.)
                <input type="file" accept="audio/*" hidden onChange={handleUpload} />
            </Button>
        </Box>
    );
}