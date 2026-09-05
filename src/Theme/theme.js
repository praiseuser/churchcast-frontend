import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#14213D" },
    secondary: { main: "#E2A33E" },
    error: { main: "#C6432B" },
    background: {
      default: "#FBF9F4",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1B2230",
      secondary: "#6B7280",
    },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Public Sans", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Newsreader", serif', fontWeight: 600 },
    h2: { fontFamily: '"Newsreader", serif', fontWeight: 600 },
    h3: { fontFamily: '"Newsreader", serif', fontWeight: 600 },
    h4: { fontFamily: '"Newsreader", serif', fontWeight: 600 },
    h5: { fontFamily: '"Newsreader", serif', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 6 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
  },
});

export default theme;