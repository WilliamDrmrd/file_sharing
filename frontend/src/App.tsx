import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
  CssBaseline,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import LeftMenu from "./components/LeftMenu";
import Folders from "./pages/Folders";
import Folder from "./pages/Folder";
import Create from "./pages/Create";
import Documentation from "./pages/Documentation";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            display: "flex",
            height: "100vh",
            bgcolor: "background.default",
            overflow: "hidden",
          }}
        >
          <LeftMenu mobileOpen={mobileOpen} onClose={handleDrawerToggle} />

          <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <AppBar
              position="static"
              color="transparent"
              elevation={0}
              sx={{
                borderBottom: `1px solid ${alpha("#fff", 0.05)}`,
                backdropFilter: "blur(16px)",
                background: alpha(theme.palette.background.default, 0.7),
                zIndex: (theme) => theme.zIndex.drawer - 1,
              }}
            >
              <Toolbar>
                <IconButton
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{
                    mr: 2,
                    display: { xs: "block", md: "none" },
                    color: "text.secondary",
                  }}
                >
                  <MenuIcon />
                </IconButton>

                <Box sx={{ flexGrow: 1 }} />
              </Toolbar>
            </AppBar>

            <Box
              component="main"
              sx={{
                flex: 1,
                p: { xs: 2, md: 3 },
                overflow: "auto",
                backgroundImage: `
                radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 30%),
                radial-gradient(circle at 90% 90%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 40%)
              `,
                transition: "all 0.3s ease",
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/folders" />} />
                <Route path="/folders" element={<Folders />} />
                <Route path="/folders/:id" element={<Folder />} />
                <Route path="/create" element={<Create />} />
                <Route path="/documentation" element={<Documentation />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}
