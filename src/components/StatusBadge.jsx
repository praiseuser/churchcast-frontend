import { Box, Typography } from "@mui/material";

const statusConfig = {
    completed: { color: "#6B7280", label: "Completed" },
    editing: { color: "#E2A33E", label: "Editing" },
    recording: { color: "#C6432B", label: "Recording" },
};

export default function StatusBadge({ status }) {
    const config = statusConfig[status] || statusConfig.completed;
    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: config.color }} />
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {config.label}
            </Typography>
        </Box>
    );
}