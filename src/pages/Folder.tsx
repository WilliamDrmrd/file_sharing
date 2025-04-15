import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchFolderContent, uploadMedia, fetchFolder, verifyFolderPassword } from "../api/mediaApi";
import { MediaItem } from "../types";
import { Typography, Button, Box, CircularProgress, Paper, useTheme, alpha, Chip, Divider, IconButton, Tooltip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import { ArrowBack, CloudUpload, PhotoLibrary, VideoCameraBack, Search, Lock } from "@mui/icons-material";
import MediaGrid from "../components/MediaGrid";

export default function Folder() {
  const { id } = useParams();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [folder, setFolder] = useState<{id: string, name: string, password?: string} | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setLoading(true);
    console.log("Fetching folder data for ID:", id);
    
    // First fetch folder details to check if password protected
    fetchFolder(id!)
      .then(folderData => {
        console.log("Folder details:", folderData);
        setFolder(folderData);
        
        // If folder has no password or password is already verified, fetch content
        if (!folderData.password || passwordVerified) {
          fetchFolderContent(id!)
            .then(items => {
              console.log("Received folder content:", items);
              setMedia(items);
              setFilteredMedia(items);
            })
            .catch(error => {
              console.error('Error fetching folder content:', error);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // If password protected, just stop loading
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching folder details:', error);
        setLoading(false);
      });
  }, [id, passwordVerified]);
  
  // Filter media based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMedia(media);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = media.filter(item => 
      // Search by ID or type
      item.id.toLowerCase().includes(lowercaseQuery) || 
      item.type.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredMedia(filtered);
  }, [searchQuery, media]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const formData = new FormData();
    for (const file of Array.from(e.target.files)) {
      formData.append("file", file);
    }
    
    // Add the uploader name - You can replace this with actual user name
    formData.append("uploadedBy", "Front-End User");
    
    try {
      setLoading(true);
      const newMedia = await uploadMedia(id!, formData);
      setMedia(prev => [newMedia, ...prev]);
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const formData = new FormData();
      for (const file of Array.from(e.dataTransfer.files)) {
        formData.append("file", file);
      }
      
      // Add the uploader name - You can replace this with actual user name
      formData.append("uploadedBy", "Front-End User");
      
      // Show loading state
      setLoading(true);
      
      uploadMedia(id!, formData)
        .then(newMedia => {
          setMedia(prev => [newMedia, ...prev]);
        })
        .catch(error => {
          console.error("Error uploading media:", error);
          alert("Failed to upload media. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  
  // Handle password verification
  const handleVerifyPassword = async () => {
    if (!folder || !id) return;
    
    setPasswordError(false);
    setLoading(true);
    
    try {
      const isVerified = await verifyFolderPassword(id, passwordInput);
      
      if (isVerified) {
        setPasswordVerified(true);
        // Fetch folder content after successful verification
        fetchFolderContent(id)
          .then(items => {
            setMedia(items);
            setFilteredMedia(items);
          })
          .catch(error => {
            console.error('Error fetching folder content:', error);
          });
      } else {
        setPasswordError(true);
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError(true);
    } finally {
      setLoading(false);
    }
  };

  const photoCount = media.filter(item => item.type === "photo").length;
  const videoCount = media.filter(item => item.type === "video").length;

  return (
    <Box 
      onDragEnter={handleDrag}
      sx={{ 
        minHeight: 'calc(100vh - 124px)', // Account for header height
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Password Dialog */}
      <Dialog open={folder?.password !== undefined && !passwordVerified} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock color="primary" />
          Protected Folder
        </DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Incorrect password. Please try again.
            </Alert>
          )}
          <Typography variant="body1" sx={{ mb: 2 }}>
            This folder is password protected. Please enter the password to view its contents.
          </Typography>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleVerifyPassword();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button component={Link} to="/folders">Go Back</Button>
          <Button 
            onClick={handleVerifyPassword} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Unlock'}
          </Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ 
        display: 'flex', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            component={Link} 
            to="/folders"
            sx={{ 
              color: 'text.secondary',
              mr: 2,
              '&:hover': { color: 'primary.main' }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Folder Content
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!loading && (
                <>
                  <Chip 
                    icon={<PhotoLibrary fontSize="small" />} 
                    label={`${photoCount} Photos`}
                    size="small"
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                  />
                  <Chip 
                    icon={<VideoCameraBack fontSize="small" />} 
                    label={`${videoCount} Videos`}
                    size="small"
                    sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}
                  />
                </>
              )}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search files..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
          
          <Button 
            variant="contained"
            component="label"
            startIcon={<CloudUpload />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1.2,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
            }}
          >
            Upload Media
            <input hidden multiple type="file" accept="image/*,video/*" onChange={onUpload} />
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : media.length === 0 ? (
        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 5,
            border: dragActive 
              ? `2px dashed ${theme.palette.primary.main}` 
              : `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            borderRadius: 4,
            bgcolor: dragActive 
              ? alpha(theme.palette.primary.main, 0.08) 
              : alpha(theme.palette.common.white, 0.02),
            transition: 'all 0.3s ease',
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            {dragActive ? 'Drop files here' : 'No media found in this folder'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 450 }}>
            {dragActive 
              ? 'Release to upload your photos and videos' 
              : 'Upload some photos or videos, or drag and drop files anywhere on this page'}
          </Typography>
          <Button 
            variant="contained"
            component="label"
            startIcon={<CloudUpload />}
          >
            Select Files
            <input hidden multiple type="file" accept="image/*,video/*" onChange={onUpload} />
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            position: 'relative',
            ...(dragActive && {
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -20,
                border: `2px dashed ${theme.palette.primary.main}`,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                zIndex: 1,
                pointerEvents: 'none',
              }
            })
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {dragActive && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(4px)',
                zIndex: 2,
                borderRadius: 4,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  Drop files here
                </Typography>
                <Typography>
                  Release to upload your photos and videos
                </Typography>
              </Box>
            </Box>
          )}
          <MediaGrid items={filteredMedia} folderId={id} />
        </Box>
      )}
    </Box>
  );
}