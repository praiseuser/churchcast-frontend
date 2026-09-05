import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Divider, CircularProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import StatusBadge from "../../components/StatusBadge";
import { getRecording } from "../../api/recordings";

export default function RecordingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recording, setRecording] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getRecording(id)
            .then(setRecording)
            .catch((err) => {
                console.error(err);
                setError("Could not load this recording.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <CircularProgress size={24} />;
    }

    if (error || !recording) {
        return <Typography color="error">{error || "Recording not found."}</Typography>;
    }

    const details = [
        { label: "Service", value: recording.type },
        { label: "Date", value: new Date(recording.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
        { label: "Recorded By", value: recording.recordedBy },
        { label: "Status", value: recording.status.charAt(0).toUpperCase() + recording.status.slice(1) },
    ];

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
                        {recording.title}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <StatusBadge status={recording.status} />
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/media/editor/${recording.id}`)}
                        sx={{ borderColor: "divider", color: "text.primary" }}
                    >
                        Edit
                    </Button>
                    {recording.videoUrl && (
                        <Button
                            variant="contained"
                            startIcon={<FileDownloadIcon />}
                            component="a"
                            href={recording.videoUrl}
                            target="_blank"
                            rel="noopener"
                            sx={{ bgcolor: "secondary.main", color: "#1B2230", "&:hover": { bgcolor: "#c98f2f" } }}
                        >
                            Download
                        </Button>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {/* Preview */}
                <Box
                    sx={{
                        flex: 2,
                        minWidth: 320,
                        aspectRatio: "16 / 9",
                        bgcolor: "#0B0F1A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    {recording.videoUrl ? (
                        <video
                            src={recording.videoUrl}
                            controls
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <Typography sx={{ color: "rgba(237,239,244,0.4)" }}>
                            Video is still processing — check back shortly.
                        </Typography>
                    )}
                </Box>

                {/* Metadata */}
                <Box sx={{ flex: 1, minWidth: 260, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                    {details.map((row, i) => (
                        <Box key={row.label}>
                            <Box sx={{ px: 3, py: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {row.label}
                                </Typography>
                                <Typography sx={{ fontWeight: 600 }}>{row.value}</Typography>
                            </Box>
                            {i < details.length - 1 && <Divider />}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}