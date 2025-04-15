import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, AppBar, Toolbar, Typography, IconButton, useTheme, alpha } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import LeftMenu from "./components/LeftMenu";
import Folders from "./pages/Folders";
import Folder from "./pages/Folder";
import Create from "./pages/Create";
import Admin from "./pages/Admin";
import Documentation from "./pages/Documentation";

export default function App() {
  const theme = useTheme();
  
  return (
    <Router>
      <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
        <LeftMenu />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <AppBar 
            position="static" 
            color="transparent" 
            elevation={0}
            sx={{ 
              borderBottom: `1px solid ${theme.palette.divider}`,
              backdropFilter: 'blur(8px)',
              background: alpha(theme.palette.background.default, 0.8)
            }}
          >
            <Toolbar>
              <IconButton 
                edge="start" 
                sx={{ 
                  mr: 2, 
                  display: { xs: 'block', md: 'none' },
                  color: 'text.secondary'
                }}
              >
                <MenuIcon />
              </IconButton>
              
              <Box sx={{ flexGrow: 1 }} />
            </Toolbar>
          </AppBar>
          
          <Box component="main" sx={{ 
            flex: 1, 
            p: { xs: 2, md: 3 }, 
            overflow: "auto",
            background: `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 25%)`,
          }}>
            <Routes>
              <Route path="/" element={<Navigate to="/folders" />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/folders/:id" element={<Folder />} />
              <Route path="/create" element={<Create />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/documentation" element={<Documentation />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}