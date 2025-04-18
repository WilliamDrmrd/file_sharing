import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { 
  Close, 
  ArrowBack, 
  ArrowForward, 
  Download, 
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import { MediaItem } from '../types';

interface MediaViewerProps {
  items: MediaItem[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function MediaViewer({ items, currentIndex, open, onClose }: MediaViewerProps) {
  const [index, setIndex] = useState(currentIndex);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Reset the index when items or currentIndex changes
  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex, items]);

  const currentItem = items[index];
  
  // Function to get the full URL for a media item
  const getFullUrl = (url: string) => {
    if (url.startsWith('/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${url}`;
    }
    return url;
  };

  // Navigation functions
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      setIndex(index - 1);
      setLoading(true);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < items.length - 1) {
      setIndex(index + 1);
      setLoading(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      if (index > 0) {
        setIndex(index - 1);
        setLoading(true);
      }
    } else if (e.key === 'ArrowRight') {
      if (index < items.length - 1) {
        setIndex(index + 1);
        setLoading(true);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Add keyboard listener when dialog is open
  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, index, items.length]);

  // Handle fullscreen toggle
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreen(!fullscreen);
  };

  // Handle download
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentItem) return;
    
    try {
      setDownloading(true);
      
      // Create an anchor element and trigger download
      const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
      const downloadUrl = `${API_BASE_URL}/media/${currentItem.id}/download`;
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // Let the server set the filename
      link.setAttribute('ngrok-skip-browser-warning', 'true');  // Add ngrok header
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloading(false);
    }
  };
  
  // Handle media load complete
  const handleMediaLoaded = () => {
    setLoading(false);
  };

  if (!currentItem) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      fullScreen={fullscreen}
    >
      <DialogContent 
        sx={{ 
          p: 0, 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
          overflow: 'hidden',
          height: fullscreen ? '100vh' : '90vh',
          width: fullscreen ? '100vw' : '90vw',
        }}
      >
        {/* Close button */}
        <IconButton
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        >
          <Close />
        </IconButton>
        
        {/* Media content */}
        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <CircularProgress 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5
              }} 
            />
          )}
          
          {currentItem.type === 'photo' ? (
            <img
              src={getFullUrl(currentItem.url)}
              alt="Media preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                opacity: loading ? 0.3 : 1,
                transition: 'opacity 0.3s ease'
              }}
              onLoad={handleMediaLoaded}
            />
          ) : (
            <video
              src={getFullUrl(currentItem.url)}
              controls
              autoPlay
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                opacity: loading ? 0.3 : 1,
                transition: 'opacity 0.3s ease'
              }}
              onLoadedData={handleMediaLoaded}
            />
          )}

          {/* Navigation buttons */}
          {index > 0 && (
            <IconButton
              onClick={goToPrevious}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <ArrowBack />
            </IconButton>
          )}
          
          {index < items.length - 1 && (
            <IconButton
              onClick={goToNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <ArrowForward />
            </IconButton>
          )}
        </Box>
        
        {/* Bottom toolbar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            bgcolor: 'rgba(0,0,0,0.7)',
          }}
        >
          <Box>
            <Typography variant="body2" color="white">
              {index + 1} / {items.length}
            </Typography>
            {currentItem.originalFilename && (
              <Typography variant="body2" color="white" sx={{ opacity: 0.8, mt: 0.5 }}>
                {currentItem.originalFilename}
              </Typography>
            )}
          </Box>
          
          <Box>
            <Button
              startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
              onClick={handleDownload}
              disabled={downloading}
              sx={{ color: 'white', mr: 1 }}
            >
              Download
            </Button>
            
            <IconButton
              onClick={toggleFullscreen}
              sx={{ color: 'white' }}
            >
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
