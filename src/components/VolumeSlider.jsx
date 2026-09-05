import { Box, Typography, Slider } from "@mui/material";

export default function VolumeSlider({ label, value, onChange, icon }) {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {icon}
                    <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.8)" }}>
                        {label}
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.45)" }}>
                    {value}%
                </Typography>
            </Box>
            <Slider
                value={value}
                onChange={(e, val) => onChange(val)}
                sx={{
                    color: "#E2A33E",
                    height: 4,
                    "& .MuiSlider-thumb": {
                        width: 14,
                        height: 14,
                        bgcolor: "#E2A33E",
                        "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 8px rgba(226,163,62,0.16)" },
                    },
                    "& .MuiSlider-rail": { bgcolor: "rgba(237,239,244,0.15)" },
                }}
            />
        </Box>
    );
}