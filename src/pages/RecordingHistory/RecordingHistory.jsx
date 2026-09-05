import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import StatusBadge from "../../components/StatusBadge";
import { getRecordings } from "../../api/recordings";

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const columns = ["Service", "Date", "Recorded By", "Status"];

export default function RecordingHistory() {
    const navigate = useNavigate();
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getRecordings()
            .then(setRecordings)
            .catch((err) => {
                console.error(err);
                setError("Could not load recording history.");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
                Recording History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                A record of every capture session and its status
            </Typography>

            {loading && <CircularProgress size={24} />}
            {error && <Typography color="error">{error}</Typography>}
            {!loading && !error && recordings.length === 0 && (
                <Typography color="text.secondary">No recordings yet.</Typography>
            )}

            {!loading && !error && recordings.length > 0 && (
                <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                    {/* Header row */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr",
                            px: 3,
                            py: 1.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        {columns.map((col) => (
                            <Typography
                                key={col}
                                variant="caption"
                                sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.3 }}
                            >
                                {col}
                            </Typography>
                        ))}
                    </Box>

                    {/* Rows */}
                    {recordings.map((rec, i) => (
                        <Box
                            key={rec.id}
                            onClick={() => navigate(`/recording/${rec.id}`)}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr",
                                px: 3,
                                py: 2,
                                borderBottom: i < recordings.length - 1 ? "1px solid" : "none",
                                borderColor: "divider",
                                alignItems: "center",
                                "&:hover": { bgcolor: "rgba(226,163,62,0.04)" },
                                cursor: "pointer",
                            }}
                        >
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{rec.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{formatDate(rec.date)}</Typography>
                            <Typography variant="body2" color="text.secondary">{rec.recordedBy}</Typography>
                            <StatusBadge status={rec.status} />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}