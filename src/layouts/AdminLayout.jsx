import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import HistoryIcon from "@mui/icons-material/History";
import Sidebar from "../components/Sidebar";

const items = [
  { label: "Dashboard", to: "/admin/dashboard", icon: DashboardIcon },
  { label: "Media Team", to: "/admin/media-team", icon: GroupIcon },
  { label: "Church Settings", to: "/admin/church-settings", icon: SettingsIcon },
  { label: "Media Library", to: "/admin/media-library", icon: VideoLibraryIcon },
  { label: "Recording History", to: "/admin/recording-history", icon: HistoryIcon },
];

export default function AdminLayout() {
  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
      <Sidebar title="Admin Workspace" items={items} />
      <Box component="main" sx={{ flex: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", minHeight: "100vh", overflowX: "hidden" }}>
        <Outlet />
      </Box>
    </Box>
  );
}