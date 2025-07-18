import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  Avatar,
  useMediaQuery,
  alpha,
  Chip,
} from "@mui/material";
import {
  Folder,
  Add,
  AdminPanelSettings,
  PhotoLibrary,
  KeyboardArrowRight,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { text: "Collections", icon: <Folder />, to: "/folders" },
  { text: "Create Collection", icon: <Add />, to: "/create" },
];

interface LeftMenuProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function LeftMenu({
  mobileOpen = false,
  onClose,
}: LeftMenuProps) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const drawerContent = (
    <>
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 50%)`,
            zIndex: -1,
          },
        }}
      >
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: { xs: 40, sm: 43, md: 46 },
            height: { xs: 40, sm: 43, md: 46 },
            background: "linear-gradient(135deg, #8B5CF6 20%, #6D28D9 100%)",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)",
            padding: "6px",
          }}
        >
          <PhotoLibrary />
        </Avatar>
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
          >
            SnapShare
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: 0.8 }}
          >
            Share memories in full quality
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.1 }} />

      <Box sx={{ px: 2, py: 3 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            pl: 2,
            fontSize: "0.7rem",
            letterSpacing: "1.2px",
            opacity: 0.6,
          }}
        >
          YOUR MEMORIES
        </Typography>
        <List sx={{ mt: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={location.pathname === item.to}
              onClick={isMobile ? onClose : undefined}
              sx={{
                borderRadius: 3,
                mb: 1,
                py: { xs: 1.2, sm: 1.3, md: 1.5 },
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s ease",
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  },
                },
                "&:hover:not(.Mui-selected)": {
                  backgroundColor: alpha(theme.palette.background.paper, 0.4),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.to
                      ? "primary.main"
                      : "text.secondary",
                  minWidth: 40,
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.25rem",
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.to ? 600 : 500,
                  fontSize: { xs: "0.875rem", sm: "0.9rem", md: "0.95rem" },
                }}
              />
              {location.pathname === item.to && (
                <KeyboardArrowRight
                  fontSize="small"
                  color="primary"
                  sx={{ opacity: 0.7 }}
                />
              )}
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ mt: "auto", p: 3 }} />
    </>
  );

  return (
    <>
      {/* Permanent drawer for desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 280,
            boxSizing: "border-box",
            background:
              "linear-gradient(180deg, rgba(11,17,32,0.98) 0%, rgba(30,41,59,0.95) 100%)",
            borderRight: `1px solid ${alpha("#fff", 0.05)}`,
            boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
          },
          display: { xs: "none", md: "block" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Temporary drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            background:
              "linear-gradient(180deg, rgba(11,17,32,0.98) 0%, rgba(30,41,59,0.95) 100%)",
            borderRight: `1px solid ${alpha("#fff", 0.05)}`,
            boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
