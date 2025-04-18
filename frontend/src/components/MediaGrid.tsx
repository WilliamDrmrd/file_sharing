import { Card, CardMedia, CardContent, Typography, Box, IconButton, Button, Chip, useTheme, alpha, Skeleton } from "@mui/material";
import { Delete, Download, Visibility, FileDownload, Image, Videocam } from "@mui/icons-material";
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
  const theme = useTheme();
  const [currentItems, setCurrentItems] = useState<MediaItem[]>(items);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loadingItems, setLoadingItems] = useState<{[key: string]: boolean}>({});
  const [blobUrls, setBlobUrls] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  useEffect(() => {
    const fetchMedia = async () => {
      const urls = await Promise.all(
          currentItems.map(async (item) => {
            try {
              const response = await fetch(getFullUrl(item.url), {
                headers: { 'ngrok-skip-browser-warning': 'true' },
              });
              if (!response.ok) {
                throw new Error(`Failed to fetch media: ${response.statusText}`);
              }
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              return [item.id, blobUrl];
            } catch (error) {
              console.error(`Error fetching media for ${item.id}:`, error);
              return [item.id, null];
            }
          })
      );

      const newBlobUrls = urls.reduce((acc, [id, url]) => {
        if (!id) return acc;
        if (url) acc[id] = url;
        return acc;
      }, {} as {[key: string]: string});

      setBlobUrls(newBlobUrls);
    };

    fetchMedia();

    return () => {
      Object.values(blobUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [currentItems]);

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
      return `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${url}`;
    }
    return url;
  };

  // Open the media viewer
  const openViewer = (index: number) => {
    setCurrentMediaIndex(index);
    setViewerOpen(true);
  };

  // Handle image load state
  const handleImageLoad = (id: string) => {
    setLoadingItems(prev => ({ ...prev, [id]: false }));
  };

  // Handle download folder as zip
  const handleDownloadFolder = () => {
    if (!folderId) return;

    // Create a link element and trigger download
    const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
    const downloadUrl = `${API_BASE_URL}/folders/${folderId}/download`;

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = ''; // Let the server set the filename
    link.setAttribute('ngrok-skip-browser-warning', 'true');  // Add ngrok header
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
      <>
        {folderId && currentItems.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileDownload />}
                  onClick={handleDownloadFolder}
                  sx={{
                    px: { xs: 2, sm: 2.5, md: 3 },
                    py: { xs: 1, sm: 1.1, md: 1.2 },
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
                  }}
              >
                Download All Files
              </Button>
            </Box>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: { xs: -0.5, sm: -0.75, md: -1.5 }, mt: 2 }}>
          {currentItems.map((item, index) => {
            const mediaSrc = blobUrls[item.id] || getFullUrl(item.url);
            const isImage = item.type === "photo";

            return (
                <Box sx={{ width: { xs: '50%', sm: '33.33%', md: '25%' }, p: { xs: 0.5, sm: 0.75, md: 1.5 } }} key={item.id}>
                  <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                  >
                    <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
                          '&:hover .media-overlay': { opacity: 1 },
                          '&:hover img, &:hover video': { transform: 'scale(1.05)' }
                        }}
                        onClick={() => openViewer(index)}
                    >
                      {loadingItems[item.id] !== false && (
                          <Skeleton
                              variant="rectangular"
                              width="100%"
                              height="100%"
                              animation="wave"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 1,
                                bgcolor: alpha(theme.palette.background.paper, 0.2)
                              }}
                          />
                      )}

                      {isImage ? (
                          <CardMedia
                              component="img"
                              image={mediaSrc}
                              alt={item.originalFilename || "Photo"}
                              sx={{
                                height: { xs: 140, sm: 160, md: 200 },
                                objectFit: "cover",
                                transition: 'transform 0.3s ease',
                              }}
                              onLoad={() => handleImageLoad(item.id)}
                          />
                      ) : (
                          <CardMedia
                              component="video"
                              src={mediaSrc}
                              sx={{
                                height: { xs: 140, sm: 160, md: 200 },
                                objectFit: "cover",
                                transition: 'transform 0.3s ease',
                              }}
                              onLoadedData={() => handleImageLoad(item.id)}
                          />
                      )}

                      {/* Type indicator */}
                      <Box
                          sx={{
                            position: 'absolute',
                            top: { xs: 8, sm: 10, md: 12 },
                            left: { xs: 8, sm: 10, md: 12 },
                            zIndex: 2
                          }}
                      >
                        <Chip
                            icon={isImage ? <Image fontSize="small" /> : <Videocam fontSize="small" />}
                            label={isImage ? "Image" : "Video"}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.background.paper, 0.7),
                              backdropFilter: 'blur(4px)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: { xs: 20, sm: 22, md: 24 },
                              '& .MuiChip-icon': {
                                color: isImage ? theme.palette.info.main : theme.palette.error.main,
                                marginLeft: '4px'
                              },
                              borderRadius: '6px',
                              border: `1px solid ${alpha('#fff', 0.1)}`
                            }}
                        />
                      </Box>

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
                            background: `linear-gradient(to top, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            backdropFilter: 'blur(3px)',
                            zIndex: 1
                          }}
                      >
                        <IconButton
                            sx={{
                              color: 'white',
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              backdropFilter: 'blur(4px)',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.3),
                              }
                            }}
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
                      flexDirection: 'column',
                      flex: 1,
                      py: { xs: 1, sm: 1.5, md: 2 },
                      px: { xs: 1, sm: 1.5, md: 2 }
                    }}>
                      <Typography
                          variant="subtitle2"
                          noWrap
                          sx={{
                            mb: { xs: 1, sm: 1.5, md: 2 },
                            fontWeight: 600,
                            fontSize: { xs: '0.85rem', sm: '0.875rem', md: '0.9rem' },
                            lineHeight: 1.3
                          }}
                      >
                        {item.originalFilename || `File_${item.id.substring(0, 8)}`}
                      </Typography>

                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 'auto',
                        gap: { xs: 1, sm: 1.5, md: 2 }
                      }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
                              window.open(`${API_BASE_URL}/media/${item.id}/download`, '_blank');
                            }}
                            sx={{
                              padding: { xs: 0.75, sm: 0.85, md: 1 },
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2)
                              }
                            }}
                        >
                          <Download fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        </IconButton>

                        {isAdmin && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                                sx={{
                                  padding: { xs: 0.75, sm: 0.85, md: 1 },
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.error.main, 0.2)
                                  }
                                }}
                            >
                              <Delete fontSize="small" sx={{ color: theme.palette.error.main }} />
                            </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      {/* Empty state */}
      {currentItems.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 4, sm: 6, md: 8 },
            m: { xs: 2, sm: 3, md: 4 },
            borderRadius: 4,
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.4)
          }}
        >
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '50%',
              p: 2,
              mb: 3
            }}
          >
            <Image
              sx={{
                fontSize: '3rem',
                color: alpha(theme.palette.primary.main, 0.7)
              }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No media files yet
          </Typography>
          <Typography color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
            Upload some files to start building your media collection.
          </Typography>
        </Box>
      )}

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
