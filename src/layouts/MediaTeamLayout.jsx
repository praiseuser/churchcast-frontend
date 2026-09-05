import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import Sidebar from "../components/Sidebar";

const items = [
    { label: "Dashboard", to: "/media/dashboard", icon: DashboardIcon },
    { label: "New Recording", to: "/media/new-recording", icon: AddCircleIcon },
    { label: "Media Library", to: "/media/media-library", icon: VideoLibraryIcon },
];

export default function MediaTeamLayout() {
    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
            <Sidebar title="Media Team Workspace" items={items} />
            <Box component="main" sx={{ flex: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", minHeight: "100vh", overflowX: "hidden" }}>
                <Outlet />
            </Box>
        </Box>
    );
}