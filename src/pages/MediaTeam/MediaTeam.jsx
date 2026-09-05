import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { getMediaTeam, addTeamMember, updateTeamMember } from "../../api/users";

export default function MediaTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = () => {
    getMediaTeam()
      .then(setTeam)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const toggleActive = async (member) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      await updateTeamMember(member.id, { status: newStatus });
      setTeam((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const newMember = await addTeamMember({ name, email, password });
      setTeam((prev) => [...prev, newMember]);
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add team member.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
            Media Team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage who has access to record and edit services
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: "secondary.main", color: "#1B2230", "&:hover": { bgcolor: "#c98f2f" } }}
        >
          Add Member
        </Button>
      </Box>

      {loading && <CircularProgress size={24} />}

      {!loading && (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          {team.map((member, i) => (
            <Box key={member.id}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 3,
                  py: 2.2,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{member.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.email} · {member.role === "admin" ? "Admin" : "Media Team"}
                  </Typography>
                </Box>
                {member.role !== "admin" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Typography>
                    <Switch
                      checked={member.status === "active"}
                      onChange={() => toggleActive(member)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#E2A33E" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#E2A33E" },
                      }}
                    />
                  </Box>
                )}
              </Box>
              {i < team.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: '"Newsreader", serif' }}>Add Media Team Member</DialogTitle>
        <Box component="form" onSubmit={handleAdd}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Temporary Password"
              type="text"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Share this with them so they can log in and change it later."
            />
            <TextField select label="Role" fullWidth margin="normal" defaultValue="Media Team" disabled>
              <MenuItem value="Media Team">Media Team</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} sx={{ color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: "secondary.main", color: "#1B2230", "&:hover": { bgcolor: "#c98f2f" } }}
            >
              {submitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}