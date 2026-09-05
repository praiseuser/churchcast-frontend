import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Fade,
  Alert,
  Snackbar,
} from "@mui/material";
import useAuthStore from "../../context/authStore";

const BAR_COUNT = 14;
const randomLevels = () =>
  Array.from({ length: BAR_COUNT }, () => 6 + Math.round(Math.random() * 26));

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [mounted, setMounted] = useState(false);
  const [levels, setLevels] = useState(randomLevels);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setLevels(randomLevels()), 900);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      setToastOpen(true);
      setTimeout(() => {
        navigate(user.role === "admin" ? "/admin/dashboard" : "/media/dashboard");
      }, 900);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "primary.main",
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(226,163,62,0.1), transparent 60%)",
        px: 2,
        py: 6,
      }}
    >
      <Fade in={mounted} timeout={700}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 880,
            transform: mounted ? "translateY(0)" : "translateY(14px)",
            transition: "transform 700ms ease",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              borderRadius: 1,
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            }}
          >
            {/* Left: brand / signal panel */}
            <Box
              sx={{
                flexBasis: { md: "44%" },
                bgcolor: "primary.main",
                backgroundImage:
                  "repeating-linear-gradient(115deg, rgba(226,163,62,0.05) 0px, rgba(226,163,62,0.05) 1px, transparent 1px, transparent 10px)",
                position: "relative",
                px: { xs: 4, md: 5 },
                py: { xs: 5, md: 6 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                clipPath: {
                  md: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
                },
                mr: { md: -3 },
                zIndex: 1,
              }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.4}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      bgcolor: "secondary.main",
                      animation: "pulse 2.2s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": {
                          boxShadow: "0 0 0 5px rgba(226,163,62,0.2)",
                        },
                        "50%": {
                          boxShadow: "0 0 0 11px rgba(226,163,62,0.05)",
                        },
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: '"Newsreader", serif',
                      fontSize: 19,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      letterSpacing: 0.2,
                    }}
                  >
                    ChurchCast Studio
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontFamily: '"Newsreader", serif',
                    fontSize: { xs: 32, md: 38 },
                    fontStyle: "italic",
                    lineHeight: 1.18,
                    color: "#FFFFFF",
                    mt: { xs: 4, md: 8 },
                    maxWidth: 300,
                  }}
                >
                  Every service, ready for the people who couldn't be in the
                  room.
                </Typography>
              </Box>

              {/* signature element: a live signal meter */}
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    letterSpacing: 1,
                    color: "rgba(255,255,255,0.4)",
                    mb: 1.2,
                  }}
                >
                  signal live
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.6}
                  alignItems="flex-end"
                  sx={{ height: 32 }}
                >
                  {levels.map((h, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 3,
                        height: h,
                        bgcolor: "secondary.main",
                        opacity: 0.5 + (i % 3) * 0.15,
                        borderRadius: 0.5,
                        transition: "height 900ms ease",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* Right: form panel */}
            <Box
              sx={{
                flex: 1,
                bgcolor: "background.paper",
                px: { xs: 4, sm: 6 },
                py: { xs: 5, md: 6 },
                position: "relative",
                zIndex: 2,
              }}
            >
              <Typography
                variant="h4"
                sx={{ fontFamily: '"Newsreader", serif', mb: 0.5 }}
              >
                Sign in
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 5 }}>
                Your workspace is one sign-in away.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  fullWidth
                  variant="standard"
                  margin="normal"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "secondary.main",
                    },
                    "& label.Mui-focused": { color: "secondary.dark" },
                  }}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  fullWidth
                  variant="standard"
                  margin="normal"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{
                    mb: 1,
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "secondary.main",
                    },
                    "& label.Mui-focused": { color: "secondary.dark" },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  disabled={submitting}
                  sx={{
                    mt: 4,
                    py: 1.4,
                    fontSize: 16,
                    borderRadius: 0.5,
                    color: "#1B2230",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#c98f2f", boxShadow: "none" },
                  }}
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 3,
              color: "rgba(237,239,244,0.5)",
            }}
          >
            Internal workspace for Church Admins and Media Teams
          </Typography>
        </Box>
      </Fade>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ bgcolor: "#1B2230", color: "#fff" }}>
          Signed in successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}