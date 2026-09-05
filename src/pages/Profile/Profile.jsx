import { useState } from "react";
import { Box, Typography, TextField, Button, Paper, Avatar, Divider, Alert } from "@mui/material";
import useAuthStore from "../../context/authStore";
import { updateProfile } from "../../api/auth";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initials = (user?.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateProfile({
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setSuccess("Profile updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
        Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage your personal account information
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: "1px solid", borderColor: "divider" }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontFamily: '"Newsreader", serif' }}>
            {initials || "?"}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role === "admin" ? "Admin" : "Media Team"}
            </Typography>
          </Box>
        </Box>

        <TextField
          label="Full Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={user?.email || ""}
          disabled
          helperText="Email cannot be changed"
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Change Password
        </Typography>
        <TextField
          label="Current Password"
          type="password"
          fullWidth
          margin="normal"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={saving}
          sx={{ mt: 4, py: 1.2, bgcolor: "secondary.main", color: "#1B2230", "&:hover": { bgcolor: "#c98f2f" } }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Paper>
    </Box>
  );
}