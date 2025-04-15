import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: "#6366f1" },
    secondary: { main: "#ec4899" },
    background: { 
      default: "#0f172a", 
      paper: "#1e293b" 
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8"
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(10px)'
        }
      }
    }
  }
});

export default theme;