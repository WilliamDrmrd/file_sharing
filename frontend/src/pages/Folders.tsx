import { CircularProgress, Typography, Box, useTheme, alpha, Button, TextField, InputAdornment } from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { Link } from "react-router-dom";
import FolderList from "../components/FolderList";
import { useFolders } from "../hooks/useFolders";
import { useState, useEffect } from "react";
import { Folder } from "../types";

export default function Folders() {
  const { folders, loading } = useFolders();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);

  // Filter folders when search query or folders change
  useEffect(() => {
    if (!loading && folders.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredFolders(folders);
      } else {
        const lowercaseQuery = searchQuery.toLowerCase();
        const filtered = folders.filter(folder =>
          folder.name.toLowerCase().includes(lowercaseQuery) ||
          folder.createdBy.toLowerCase().includes(lowercaseQuery)
        );
        setFilteredFolders(filtered);
      }
    } else {
      setFilteredFolders(folders);
    }
  }, [searchQuery, folders, loading]);

  return (
    <Box>
      <Box sx={{
        display: 'flex',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 0 },
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Folders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and manage media folders
          </Typography>
        </Box>

        <Button
          variant="contained"
          component={Link}
          to="/create"
          startIcon={<Add />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            alignSelf: { xs: 'stretch', md: 'auto' },
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
          }}
        >
          New Folder
        </Button>
      </Box>

      {/* Search Box */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search folders by name or creator..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            sx: { borderRadius: 2 }
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : folders.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 10,
          px: 2,
          borderRadius: 4,
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>No folders found</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create a new folder to start organizing your media
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/create"
            startIcon={<Add />}
          >
            Create your first folder
          </Button>
        </Box>
      ) : filteredFolders.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 10,
          px: 2,
          borderRadius: 4,
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>No matching folders</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Try a different search term
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        </Box>
      ) : (
        <FolderList folders={filteredFolders} />
      )}
    </Box>
  );
}
