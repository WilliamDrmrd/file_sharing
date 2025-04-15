import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchFolderContent, uploadMedia } from "../api/mediaApi";
import { MediaItem } from "../types";
import { Typography, Button, Box, CircularProgress, Paper, useTheme, alpha, Chip, Divider, IconButton, Tooltip } from "@mui/material";
import { ArrowBack, CloudUpload, PhotoLibrary, VideoCameraBack } from "@mui/icons-material";
import MediaGrid from "../components/MediaGrid";

export default function Folder() {
  const { id } = useParams();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    fetchFolderContent(id!).then(items => {
      setMedia(items);
      setLoading(false);
    });
  }, [id]);

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
          <MediaGrid items={media} folderId={id} />
        </Box>
      )}
    </Box>
  );
}