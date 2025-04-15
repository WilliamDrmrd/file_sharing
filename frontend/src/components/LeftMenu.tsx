import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider, useTheme, Avatar, useMediaQuery } from "@mui/material";
import { Folder, Add, AdminPanelSettings, Image } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { text: "View Folders", icon: <Folder />, to: "/folders" },
  { text: "Create Folder", icon: <Add />, to: "/create" },
  { text: "Admin", icon: <AdminPanelSettings />, to: "/admin" }
];

interface LeftMenuProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function LeftMenu({ mobileOpen = false, onClose }: LeftMenuProps) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const drawerContent = (
    <>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          <Image />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            MediaVault
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Share your media securely
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ opacity: 0.2 }} />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ pl: 2 }}>
          MENU
        </Typography>
        <List sx={{ mt: 1 }}>
          {menuItems.map(item => (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={location.pathname === item.to}
              onClick={isMobile ? onClose : undefined}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.25)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.to ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.to ? 600 : 400,
                  fontSize: '0.95rem'
                }} 
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
      
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Need help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Check our documentation for tips on using MediaVault.
          </Typography>
          <Box 
            component={Link} 
            to="/documentation" 
            sx={{
              display: 'inline-block',
              fontSize: '0.875rem',
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            View Documentation
          </Box>
        </Box>
      </Box>
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
            background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(31,41,55,0.95) 100%)',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
          display: { xs: 'none', md: 'block' }
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
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(31,41,55,0.95) 100%)',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}