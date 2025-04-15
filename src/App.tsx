import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, AppBar, Toolbar, Typography, IconButton, InputBase, Avatar, useTheme, alpha } from "@mui/material";
import { Search as SearchIcon, Notifications, Menu as MenuIcon } from "@mui/icons-material";
import LeftMenu from "./components/LeftMenu";
import Folders from "./pages/Folders";
import Folder from "./pages/Folder";
import Create from "./pages/Create";
import Admin from "./pages/Admin";

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
              
              <Box sx={{ 
                position: 'relative',
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.common.white, 0.07),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
                width: '100%',
                maxWidth: 400,
                ml: { xs: 0, md: 2 },
              }}>
                <Box sx={{ 
                  padding: theme.spacing(0, 2),
                  height: '100%', 
                  position: 'absolute', 
                  pointerEvents: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </Box>
                <InputBase
                  placeholder="Search folders or media…"
                  sx={{
                    color: 'inherit',
                    padding: theme.spacing(1, 1, 1, 0),
                    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                    transition: theme.transitions.create('width'),
                    width: '100%',
                    fontSize: '0.875rem'
                  }}
                />
              </Box>
              
              <Box sx={{ flexGrow: 1 }} />
              
              <IconButton sx={{ color: 'text.secondary', mr: 2 }}>
                <Notifications />
              </IconButton>
              
              <Avatar 
                alt="User" 
                src="https://i.pravatar.cc/300" 
                sx={{ width: 32, height: 32, cursor: 'pointer' }}
              />
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
            </Routes>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}