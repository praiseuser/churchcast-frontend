import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import MediaTeamLayout from "../layouts/MediaTeamLayout";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import RecordingStudio from "../pages/RecordingStudio/RecordingStudio";
import VideoEditor from "../pages/VideoEditor/VideoEditor";
import MediaLibrary from "../pages/MediaLibrary/MediaLibrary";
import RecordingHistory from "../pages/RecordingHistory/RecordingHistory";
import MediaDashboard from "../pages/MediaDashboard/MediaDashboard";
import NewRecording from "../pages/NewRecording/NewRecording";
import RecordingDetails from "../pages/RecordingDetails/RecordingDetails";
import MediaTeam from "../pages/MediaTeam/MediaTeam";
import ChurchSettings from "../pages/ChurchSettings/ChurchSettings";
import Broadcast from "../pages/Broadcast/Broadcast";
import Viewer from "../pages/Viewer/Viewer";
import Profile from "../pages/Profile/Profile";
import Login from "../pages/Login/Login";
import PageStub from "../components/PageStub";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="media-team" element={<MediaTeam />} />
                <Route path="church-settings" element={<ChurchSettings />} />
                <Route path="media-library" element={<MediaLibrary />} />
                <Route path="recording-history" element={<RecordingHistory />} />
            </Route>

            <Route path="/media" element={<MediaTeamLayout />}>
                <Route path="dashboard" element={<MediaDashboard />} />
                <Route path="new-recording" element={<NewRecording />} />
                <Route path="recording-studio/:id" element={<RecordingStudio />} />
                <Route path="editor/:id" element={<VideoEditor />} />
                <Route path="media-library" element={<MediaLibrary />} />
                {/* <Route path="/profile" element={<Profile />} /> */}
            </Route>

            <Route path="/profile" element={<Profile />} />
            <Route path="/recording/:id" element={<RecordingDetails />} />
            <Route path="/test/broadcast" element={<Broadcast />} />
            <Route path="/test/viewer" element={<Viewer />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}