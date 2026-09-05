import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Divider, CircularProgress } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import StatusBadge from "../../components/StatusBadge";
import useAuthStore from "../../context/authStore";
import { getRecordings } from "../../api/recordings";

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MediaDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecordings()
      .then((data) => setRecordings(data.slice(0, 5)))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
        Welcome back, {user?.name?.split(" ")[0] || "there"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 5 }}>
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </Typography>

      {/* Quick actions */}
      <Box sx={{ display: "flex", gap: 3, mb: 6, flexWrap: "wrap" }}>
        <Box
          onClick={() => navigate("/media/new-recording")}
          sx={{
            flex: "1 1 260px",
            bgcolor: "primary.main",
            color: "#fff",
            p: 4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            "&:hover": { bgcolor: "#1c2c50" },
          }}
        >
          <VideocamIcon sx={{ color: "secondary.main", fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Start a New Recording</Typography>
            <Typography variant="body2" sx={{ color: "rgba(237,239,244,0.6)" }}>
              Set up the studio for a service
            </Typography>
          </Box>
        </Box>

        <Box
          onClick={() => navigate("/media/media-library")}
          sx={{
            flex: "1 1 260px",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            p: 4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            "&:hover": { bgcolor: "rgba(226,163,62,0.05)" },
          }}
        >
          <MovieCreationIcon sx={{ color: "secondary.dark", fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Continue Editing</Typography>
            <Typography variant="body2" color="text.secondary">
              Browse your recordings
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Recent work */}
      <Typography variant="h6" sx={{ fontFamily: '"Newsreader", serif', mb: 2 }}>
        Recent Work
      </Typography>

      {loading && <CircularProgress size={24} />}

      {!loading && recordings.length === 0 && (
        <Typography color="text.secondary">No recordings yet — start your first one above.</Typography>
      )}

      {!loading && recordings.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          {recordings.map((rec, i) => (
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
                    {formatDayLabel(rec.date)}
                  </Typography>
                </Box>
                <StatusBadge status={rec.status} />
              </Box>
              {i < recordings.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}