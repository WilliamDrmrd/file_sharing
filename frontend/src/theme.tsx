import { createTheme, alpha } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8B5CF6" }, // Vibrant purple
    secondary: { main: "#F472B6" }, // Soft pink
    info: { main: "#60A5FA" }, // Bright blue
    success: { main: "#34D399" }, // Emerald green
    warning: { main: "#FBBF24" }, // Amber
    error: { main: "#F87171" }, // Red
    background: {
      default: "#0B1120", // Deeper dark blue
      paper: "#1E293B", // Slate
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
    },
  },
  shape: {
    borderRadius: 16, // Rounded corners
  },
  typography: {
    fontFamily:
      "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#0B1120",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#475569",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#64748B",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 20px",
          borderRadius: "12px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
        },
        outlinedPrimary: {
          borderWidth: "2px",
          "&:hover": {
            borderWidth: "2px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          background: alpha("#1E293B", 0.8),
          backdropFilter: "blur(8px)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: alpha("#8B5CF6", 0.15),
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          "&.Mui-selected": {
            backgroundColor: alpha("#8B5CF6", 0.08),
            "&:hover": {
              backgroundColor: alpha("#8B5CF6", 0.12),
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
