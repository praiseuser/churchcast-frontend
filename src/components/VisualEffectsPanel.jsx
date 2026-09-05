import { Box, Typography, Slider, Switch, Stack } from "@mui/material";

export const FILTER_PRESETS = {
    natural: { label: "Natural", brightness: 100, contrast: 100, saturate: 100, sepia: 0, hue: 0, grayscale: 0 },
    warm: { label: "Warm", brightness: 102, contrast: 105, saturate: 120, sepia: 15, hue: -5, grayscale: 0 },
    cool: { label: "Cool", brightness: 102, contrast: 105, saturate: 105, sepia: 0, hue: 8, grayscale: 0 },
    vibrant: { label: "Vibrant", brightness: 100, contrast: 110, saturate: 140, sepia: 0, hue: 0, grayscale: 0 },
    bw: { label: "Black & White", brightness: 105, contrast: 105, saturate: 0, sepia: 0, hue: 0, grayscale: 100 },
    vintage: { label: "Vintage", brightness: 105, contrast: 90, saturate: 85, sepia: 35, hue: 0, grayscale: 0 },
};

export default function VisualEffectsPanel({
    selectedPreset,
    onPresetSelect,
    brightness,
    contrast,
    saturation,
    onBrightnessChange,
    onContrastChange,
    onSaturationChange,
    vignette,
    onVignetteToggle,
}) {
    return (
        <Box>
            <Typography
                variant="overline"
                sx={{ color: "rgba(237,239,244,0.45)", letterSpacing: 1, fontSize: 11 }}
            >
                Visual Effects
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 1.5, mb: 2.5 }}>
                {Object.entries(FILTER_PRESETS).map(([id, preset]) => (
                    <Box
                        key={id}
                        onClick={() => onPresetSelect(id)}
                        sx={{
                            px: 1.4,
                            py: 0.6,
                            borderRadius: 5,
                            fontSize: 12,
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: selectedPreset === id ? "secondary.main" : "rgba(237,239,244,0.2)",
                            color: selectedPreset === id ? "#fff" : "rgba(237,239,244,0.7)",
                            bgcolor: selectedPreset === id ? "rgba(226,163,62,0.15)" : "transparent",
                            "&:hover": { borderColor: "secondary.main" },
                        }}
                    >
                        {preset.label}
                    </Box>
                ))}
            </Stack>

            {[
                { label: "Brightness", value: brightness, onChange: onBrightnessChange },
                { label: "Contrast", value: contrast, onChange: onContrastChange },
                { label: "Saturation", value: saturation, onChange: onSaturationChange },
            ].map((ctrl) => (
                <Box key={ctrl.label} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>
                            {ctrl.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.5)" }}>
                            {ctrl.value}%
                        </Typography>
                    </Box>
                    <Slider
                        value={ctrl.value}
                        min={50}
                        max={150}
                        onChange={(e, val) => ctrl.onChange(val)}
                        size="small"
                        sx={{
                            color: "#E2A33E",
                            "& .MuiSlider-thumb": { width: 12, height: 12 },
                            "& .MuiSlider-rail": { bgcolor: "rgba(237,239,244,0.15)" },
                        }}
                    />
                </Box>
            ))}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>
                    Vignette
                </Typography>
                <Switch
                    checked={vignette}
                    onChange={(e) => onVignetteToggle(e.target.checked)}
                    size="small"
                    sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#E2A33E" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#E2A33E" },
                    }}
                />
            </Box>
        </Box>
    );
}