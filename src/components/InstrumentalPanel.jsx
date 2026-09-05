import { useRef, useState, useEffect } from "react";
import { Box, Typography, IconButton, Slider, Switch, Stack } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PianoIcon from "@mui/icons-material/Piano";

const PRESETS = [
  { id: "soft-piano", label: "Soft Piano Pad", notes: [261.63, 329.63, 392.0] },
  { id: "warm-keys", label: "Warm Keys", notes: [220.0, 277.18, 329.63] },
  { id: "gentle-ambience", label: "Gentle Ambience", notes: [196.0, 246.94, 293.66, 392.0] },
  { id: "worship-pad", label: "Worship Pad", notes: [246.94, 311.13, 369.99] },
];

function buildReverbImpulse(audioContext, duration = 3.2, decay = 2.5) {
  const rate = audioContext.sampleRate;
  const length = rate * duration;
  const impulse = audioContext.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export default function InstrumentalPanel() {
  const contextRef = useRef(null);
  const nodesRef = useRef(null);
  const voicesRef = useRef([]);

  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(35);
  const [reverbOn, setReverbOn] = useState(true);
  const [echoOn, setEchoOn] = useState(false);
  const [warmthOn, setWarmthOn] = useState(true);

  const setupAudioGraph = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    const masterGain = ctx.createGain();
    masterGain.gain.value = volume / 100;

    // Lowpass to round off harsh harmonics
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1400;
    lowpass.Q.value = 0.3;

    // "Warmth" — low-shelf boost, adds body/roundness
    const warmthShelf = ctx.createBiquadFilter();
    warmthShelf.type = "lowshelf";
    warmthShelf.frequency.value = 300;
    warmthShelf.gain.value = warmthOn ? 6 : 0;

    // Reverb send
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    dryGain.gain.value = reverbOn ? 0.35 : 1;
    wetGain.gain.value = reverbOn ? 0.65 : 0;
    const convolver = ctx.createConvolver();
    convolver.buffer = buildReverbImpulse(ctx);

    // Echo send — delay with feedback loop
    const echoInputGain = ctx.createGain();
    echoInputGain.gain.value = echoOn ? 0.35 : 0;
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.42;
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.value = 0.32;
    const echoOutGain = ctx.createGain();
    echoOutGain.gain.value = 0.5;

    masterGain.connect(lowpass);
    lowpass.connect(warmthShelf);

    warmthShelf.connect(dryGain);
    warmthShelf.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(ctx.destination);
    wetGain.connect(ctx.destination);

    warmthShelf.connect(echoInputGain);
    echoInputGain.connect(delay);
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(echoOutGain);
    echoOutGain.connect(ctx.destination);

    contextRef.current = ctx;
    nodesRef.current = { masterGain, warmthShelf, dryGain, wetGain, echoInputGain };
    return { ctx, masterGain };
  };

  const stopPad = () => {
    const ctx = contextRef.current;
    voicesRef.current.forEach(({ oscA, oscB, oscC, noteGain }) => {
      if (ctx) {
        noteGain.gain.cancelScheduledValues(ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      }
      setTimeout(() => {
        [oscA, oscB, oscC].forEach((osc) => {
          try {
            osc.stop();
          } catch {
            /* already stopped */
          }
        });
      }, 1250);
    });
    voicesRef.current = [];
  };

  const buildVoice = (ctx, masterGain, freq, voiceCount) => {
    const noteGain = ctx.createGain();
    noteGain.gain.value = 0;
    noteGain.gain.linearRampToValueAtTime(0.9 / voiceCount, ctx.currentTime + 1.8);

    const oscA = ctx.createOscillator();
    oscA.type = "sine";
    oscA.frequency.value = freq;

    const oscB = ctx.createOscillator();
    oscB.type = "triangle";
    oscB.frequency.value = freq * 1.003;

    const oscC = ctx.createOscillator();
    oscC.type = "sine";
    oscC.frequency.value = freq * 0.997;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(oscB.frequency);
    lfo.start();

    oscA.connect(noteGain);
    oscB.connect(noteGain);
    oscC.connect(noteGain);
    noteGain.connect(masterGain);

    oscA.start();
    oscB.start();
    oscC.start();

    return { oscA, oscB, oscC, lfo, noteGain };
  };

  const playPreset = (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    const { ctx, masterGain } = setupAudioGraph();
    voicesRef.current = preset.notes.map((freq) =>
      buildVoice(ctx, masterGain, freq, preset.notes.length)
    );
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPad();
      setTimeout(() => contextRef.current?.close(), 1300);
      setIsPlaying(false);
    } else {
      playPreset(selectedPreset);
      setIsPlaying(true);
    }
  };

  const handlePresetSelect = (id) => {
    setSelectedPreset(id);
    if (isPlaying) {
      stopPad();
      const prevCtx = contextRef.current;
      setTimeout(() => {
        prevCtx?.close();
        playPreset(id);
      }, 200);
    }
  };

  const handleVolumeChange = (val) => {
    setVolume(val);
    if (nodesRef.current) nodesRef.current.masterGain.gain.value = val / 100;
  };

  const handleReverbToggle = (checked) => {
    setReverbOn(checked);
    if (nodesRef.current) {
      nodesRef.current.dryGain.gain.value = checked ? 0.35 : 1;
      nodesRef.current.wetGain.gain.value = checked ? 0.65 : 0;
    }
  };

  const handleEchoToggle = (checked) => {
    setEchoOn(checked);
    if (nodesRef.current) {
      nodesRef.current.echoInputGain.gain.value = checked ? 0.35 : 0;
    }
  };

  const handleWarmthToggle = (checked) => {
    setWarmthOn(checked);
    if (nodesRef.current) {
      nodesRef.current.warmthShelf.gain.value = checked ? 6 : 0;
    }
  };

  useEffect(() => {
    return () => {
      stopPad();
      contextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectToggles = [
    { label: "Reverb", checked: reverbOn, onChange: handleReverbToggle },
    { label: "Echo", checked: echoOn, onChange: handleEchoToggle },
    { label: "Warmth", checked: warmthOn, onChange: handleWarmthToggle },
  ];

  return (
    <Box>
      <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.55)", mb: 1.5 }}>
        Instrumental
      </Typography>

      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        {PRESETS.map((preset) => (
          <Box
            key={preset.id}
            onClick={() => handlePresetSelect(preset.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 1.5,
              py: 1,
              borderRadius: 1,
              cursor: "pointer",
              bgcolor: selectedPreset === preset.id ? "rgba(226,163,62,0.12)" : "transparent",
              "&:hover": { bgcolor: "rgba(237,239,244,0.06)" },
            }}
          >
            <PianoIcon
              sx={{
                fontSize: 16,
                color: selectedPreset === preset.id ? "secondary.main" : "rgba(237,239,244,0.4)",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: selectedPreset === preset.id ? "#fff" : "rgba(237,239,244,0.75)",
                fontWeight: selectedPreset === preset.id ? 600 : 400,
              }}
            >
              {preset.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <IconButton
          onClick={togglePlay}
          sx={{
            bgcolor: isPlaying ? "rgba(198,67,43,0.2)" : "rgba(237,239,244,0.1)",
            "&:hover": { bgcolor: isPlaying ? "rgba(198,67,43,0.3)" : "rgba(237,239,244,0.18)" },
          }}
        >
          {isPlaying ? <StopIcon sx={{ color: "#fff" }} /> : <PlayArrowIcon sx={{ color: "#fff" }} />}
        </IconButton>
        <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>
          {isPlaying ? "Playing" : "Stopped"}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>
            Volume
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>
            {volume}%
          </Typography>
        </Box>
        <Slider
          value={volume}
          onChange={(e, val) => handleVolumeChange(val)}
          size="small"
          sx={{
            color: "#E2A33E",
            "& .MuiSlider-thumb": { width: 12, height: 12 },
            "& .MuiSlider-rail": { bgcolor: "rgba(237,239,244,0.15)" },
          }}
        />
      </Box>

      <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.45)", display: "block", mb: 0.5 }}>
        Audio Effects
      </Typography>
      <Stack spacing={0.8}>
        {effectToggles.map((fx) => (
          <Box key={fx.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>
              {fx.label}
            </Typography>
            <Switch
              checked={fx.checked}
              onChange={(e) => fx.onChange(e.target.checked)}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#E2A33E" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#E2A33E" },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}