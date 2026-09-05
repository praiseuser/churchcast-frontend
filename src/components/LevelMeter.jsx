import { useEffect, useState } from "react";
import { Box } from "@mui/material";

export default function LevelMeter({ active }) {
    const [levels, setLevels] = useState(Array(14).fill(0.1));

    useEffect(() => {
        if (!active) {
            setLevels(Array(14).fill(0.1));
            return;
        }
        const interval = setInterval(() => {
            setLevels((prev) => prev.map(() => Math.random() * 0.85 + 0.1));
        }, 120);
        return () => clearInterval(interval);
    }, [active]);

    return (
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 60 }}>
            {levels.map((lvl, i) => (
                <Box
                    key={i}
                    sx={{
                        width: 6,
                        height: `${lvl * 100}%`,
                        bgcolor: lvl > 0.75 ? "#C6432B" : "#E2A33E",
                        transition: "height 0.1s ease",
                        borderRadius: 0.5,
                    }}
                />
            ))}
        </Box>
    );
}