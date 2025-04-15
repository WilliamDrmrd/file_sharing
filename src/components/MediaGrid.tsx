import { Card, CardMedia, CardContent, Typography, Box, IconButton, Button } from "@mui/material";
import { Delete, Download, Visibility, FileDownload } from "@mui/icons-material";
import { MediaItem } from "../types";
import { useState, useEffect } from "react";
import { deleteMedia } from "../api/mediaApi";
import MediaViewer from "./MediaViewer";

interface Props {
  items: MediaItem[];
  isAdmin?: boolean;
  folderId?: string;
}

export default function MediaGrid({ items, isAdmin = false, folderId }: Props) {
  const [currentItems, setCurrentItems] = useState<MediaItem[]>(items);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  useEffect(() => {
    setCurrentItems(items);
  }, [items]);
  
  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      setCurrentItems(currentItems.filter(item => item.id !== mediaId));
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };
  
  // Prepend domain if the URL is relative
  const getFullUrl = (url: string) => {
    if (url.startsWith('/')) {
      return `http://localhost:3000${url}`;
    }
    return url;
  };
  
  // Open the media viewer
  const openViewer = (index: number) => {
    setCurrentMediaIndex(index);
    setViewerOpen(true);
  };
  
  // Handle download folder as zip
  const handleDownloadFolder = () => {
    if (!folderId) return;
    
    // Create a link element and trigger download
    const downloadUrl = `http://localhost:3000/api/folders/${folderId}/download`;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = ''; // Let the server set the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      {folderId && currentItems.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleDownloadFolder}
          >
            Download All
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1, mt: 2 }}>
        {currentItems.map((item, index) => {
          const fullUrl = getFullUrl(item.url);
          
          return (
            <Box sx={{ width: { xs: '50%', sm: '33.33%', md: '25%' }, p: 1 }} key={item.id}>
              <Card>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    cursor: 'pointer',
                    '&:hover .media-overlay': { opacity: 1 }
                  }}
                  onClick={() => openViewer(index)}
                >
                  {item.type === "photo" ? (
                    <CardMedia
                      component="img"
                      image={fullUrl}
                      alt="Photo"
                      sx={{ height: 180, objectFit: "cover" }}
                    />
                  ) : (
                    <CardMedia
                      component="video"
                      src={fullUrl}
                      controls
                      sx={{ height: 180, objectFit: "cover" }}
                    />
                  )}
                  
                  {/* Overlay with view icon */}
                  <Box 
                    className="media-overlay"
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.5)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <IconButton 
                      sx={{ color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewer(index);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Box>
                </Box>
                
                <CardContent sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  py: 1,
                  px: 1
                }}>
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`http://localhost:3000/api/media/${item.id}/download`, '_blank');
                    }}
                    sx={{ padding: 0.5 }}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                  
                  {isAdmin && (
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      sx={{ padding: 0.5 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
      
      {/* Media viewer dialog */}
      <MediaViewer
        items={currentItems}
        currentIndex={currentMediaIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}