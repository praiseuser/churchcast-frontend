import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, InputAdornment, Divider, CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StatusBadge from "../../components/StatusBadge";
import { getRecordings } from "../../api/recordings";

function formatMonthLabel(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDayLabel(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MediaLibrary() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getRecordings()
            .then(setRecordings)
            .catch((err) => {
                console.error(err);
                setError("Could not load recordings.");
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = recordings.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase())
    );

    const grouped = filtered.reduce((acc, rec) => {
        const month = formatMonthLabel(rec.date);
        if (!acc[month]) acc[month] = [];
        acc[month].push(rec);
        return acc;
    }, {});

    return (
        <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
                Media Library
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                All recorded services, organized by month
            </Typography>

            <TextField
                placeholder="Search recordings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 5, maxWidth: 420, bgcolor: "background.paper" }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        </InputAdornment>
                    ),
                }}
            />

            {loading && <CircularProgress size={24} />}
            {error && <Typography color="error">{error}</Typography>}
            {!loading && !error && recordings.length === 0 && (
                <Typography color="text.secondary">No recordings yet.</Typography>
            )}

            {Object.entries(grouped).map(([month, items]) => (
                <Box key={month} sx={{ mb: 5 }}>
                    <Typography
                        variant="overline"
                        sx={{ color: "secondary.dark", letterSpacing: 1, fontWeight: 700, fontSize: 12 }}
                    >
                        {month}
                    </Typography>

                    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", mt: 1 }}>
                        {items.map((rec, i) => (
                            <Box key={rec.id}>
                                <Box
                                    onClick={() => navigate(`/media/editor/${rec.id}`)}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        px: 3,
                                        py: 2.2,
                                        cursor: "pointer",
                                        "&:hover": { bgcolor: "rgba(226,163,62,0.04)" },
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 600 }}>{rec.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {rec.type} · {formatDayLabel(rec.date)} · {rec.recordedBy}
                                        </Typography>
                                    </Box>
                                    <StatusBadge status={rec.status} />
                                </Box>
                                {i < items.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}