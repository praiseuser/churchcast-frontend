import { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Avatar, CircularProgress, Alert } from "@mui/material";
import { getChurch, updateChurch } from "../../api/church";

export default function ChurchSettings() {
    const [churchName, setChurchName] = useState("");
    const [brandColor, setBrandColor] = useState("#E2A33E");
    const [facebookStreamUrl, setFacebookStreamUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getChurch()
            .then((data) => {
                setChurchName(data.name || "");
                setBrandColor(data.brandingColors || "#E2A33E");
                setFacebookStreamUrl(data.facebookStreamUrl || "");
            })
            .catch((err) => {
                console.error(err);
                setError("Could not load church settings.");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError("");
        try {
            await updateChurch({ name: churchName, brandingColors: brandColor, facebookStreamUrl });
            setSaved(true);
        } catch (err) {
            setError(err.response?.data?.message || "Could not save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <CircularProgress size={24} />;
    }

    return (
        <Box sx={{ maxWidth: 560 }}>
            <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
                Church Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Manage your church profile and branding
            </Typography>

            <Paper elevation={0} sx={{ p: 4, border: "1px solid", borderColor: "divider" }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {saved && <Alert severity="success" sx={{ mb: 2 }}>Changes saved.</Alert>}

                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontFamily: '"Newsreader", serif' }}>
                        {churchName ? churchName.slice(0, 2).toUpperCase() : "CH"}
                    </Avatar>
                    <Button variant="outlined" sx={{ borderColor: "divider", color: "text.primary" }} disabled>
                        Upload Logo (coming soon)
                    </Button>
                </Box>

                <TextField
                    label="Church Name"
                    fullWidth
                    margin="normal"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                />

                <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Brand Color
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: brandColor,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        />
                        <TextField
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            size="small"
                            sx={{ width: 140 }}
                        />
                    </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Facebook Live Stream URL
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="rtmps://live-api-s.facebook.com:443/rtmp/YOUR-STREAM-KEY"
                        value={facebookStreamUrl}
                        onChange={(e) => setFacebookStreamUrl(e.target.value)}
                        helperText="From Facebook's Live Producer — combine the Server URL and Stream Key into one link"
                    />
                </Box>

                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ mt: 4, bgcolor: "secondary.main", color: "#1B2230", "&:hover": { bgcolor: "#c98f2f" } }}
                >
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </Paper>
        </Box>
    );
}