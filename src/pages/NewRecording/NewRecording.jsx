import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Alert,
} from "@mui/material";
import { startRecording } from "../../api/recordings";

const serviceTypes = ["Sunday Service", "Bible Study", "Praise & Worship", "Workshop", "Special Service"];

export default function NewRecording() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Sunday Service");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!title || !date) {
      setError("Please fill in the service title and date.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const recording = await startRecording({ title, type, date });
      console.log("Recording created:", recording);
      navigate(`/media/recording-studio/${recording.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start recording. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 520 }}>
      <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
        New Recording
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Set up the service before entering the Recording Studio
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 4, border: "1px solid", borderColor: "divider", borderTop: "4px solid", borderTopColor: "secondary.main" }}
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleStart} noValidate>
          <TextField
            label="Service Title"
            placeholder="e.g. Sunday Service"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            select
            label="Service Type"
            fullWidth
            margin="normal"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {serviceTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            disabled={submitting}
            sx={{ mt: 4, py: 1.3, color: "#1B2230" }}
          >
            {submitting ? "Starting..." : "Enter Recording Studio"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}