import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const DRAWER_WIDTH = 250;

export default function Sidebar({ title, items }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width:900px)");

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "primary.main", color: "#EDEFF4" }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Newsreader", serif', fontWeight: 600, color: "#FFFFFF" }}>
          ChurchCast Studio
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(237,239,244,0.6)" }}>
          {title}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(237,239,244,0.12)" }} />

      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {items.map(({ label, to, icon: Icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              pl: 1.5,
              position: "relative",
              color: "rgba(237,239,244,0.75)",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: 3,
                borderRadius: 2,
                bgcolor: "transparent",
              },
              "&.active": {
                bgcolor: "rgba(226,163,62,0.08)",
                color: "#FFFFFF",
                "&::before": { bgcolor: "secondary.main" },
                "& .MuiListItemIcon-root": { color: "secondary.main" },
              },
              "&:hover": { bgcolor: "rgba(237,239,244,0.06)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}>
              {label}
            </ListItemText>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  if (isDesktop) {
    return (
      <Box
        component="nav"
        sx={{ width: DRAWER_WIDTH, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}
      >
        {content}
      </Box>
    );
  }

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: "primary.main", zIndex: 1201 }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: "#fff", mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography sx={{ fontFamily: '"Newsreader", serif', fontWeight: 600 }}>
            ChurchCast Studio
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none" } }}
      >
        {content}
      </Drawer>
      <Toolbar />
    </>
  );
}