import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  useTheme,
  alpha,
  Skeleton,
} from "@mui/material";
import {
  Delete,
  Download,
  Visibility,
  FileDownload,
  Image,
  Videocam,
} from "@mui/icons-material";
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
  const [loadingItems, setLoadingItems] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [blobUrls, setBlobUrls] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  // Single effect to manage media loading
  useEffect(() => {
    if (currentItems.length === 0) return;

    // Set all items to loading state initially
    const newLoadingItems = currentItems.reduce(
      (acc, item) => {
        acc[item.id] = true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );
    setLoadingItems(newLoadingItems);

    // We'll keep track of which requests are in progress to avoid duplicates
    const pendingRequests = new Map<string, Promise<string | null>>();

    const fetchItem = async (item: MediaItem): Promise<string | null> => {
      // Check if this item is already being fetched
      if (pendingRequests.has(item.id)) {
        return pendingRequests.get(item.id) as Promise<string | null>;
      }
      // Start a new fetch request
      const fetchPromise = (async () => {
        try {
          const response = await fetch(getFullUrl(item.url));

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }

          // Get the media as a blob
          const blob = await response.blob();
          // Create a blob URL that can be used directly by img/video tags
          const blobUrl = URL.createObjectURL(blob);
          return blobUrl;
        } catch (error) {
          console.error(`Error loading media ${item.id}:`, error);
          return null;
        } finally {
          // Remove from pending requests when done
          pendingRequests.delete(item.id);
        }
      })();

      // Store the promise so we don't start duplicate requests
      pendingRequests.set(item.id, fetchPromise);
      return fetchPromise;
    };


// Process items in batches to avoid overwhelming the browser
    const processInBatches = async () => {
      const batchSize = 3; // Process 3 items per batch
      const newBlobUrls: { [key: string]: string } = { ...blobUrls };

      // Process in batches
      for (let i = 0; i < currentItems.length; i += batchSize) {
        const batchItems = currentItems.slice(i, i + batchSize);

        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} with ${batchItems.length} items`);

        // Process this batch in parallel with Promise.all
        const results = await Promise.all(
            batchItems.map(async (item) => {
              // Skip if we already have this URL
              if (blobUrls[item.id]) {
                setLoadingItems((prev) => ({ ...prev, [item.id]: false }));
                return [item.id, blobUrls[item.id]];
              }

              const blobUrl = await fetchItem(item);

              // Update loading state regardless of success/failure
              setLoadingItems((prev) => ({ ...prev, [item.id]: false }));

              return [item.id, blobUrl];
            })
        );

        // Update blob URLs with results from this batch
        results.forEach(([id, url]) => {
          if (id && url) newBlobUrls[id as string] = url as string;
        });

        // Update our state after each batch
        setBlobUrls({ ...newBlobUrls });

        // Optional: Add a small delay between batches to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    // Start processing
    processInBatches();

    // Clean up when unmounting or when items change
    return () => {
      // Only revoke URLs that are no longer needed
      const currentIds = new Set(currentItems.map((item) => item.id));
      Object.entries(blobUrls).forEach(([id, url]) => {
        if (!currentIds.has(id)) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [currentItems]);

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      setCurrentItems(currentItems.filter((item) => item.id !== mediaId));
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  // Prepend domain if the URL is relative
  const getFullUrl = (url: string) => {
    if (url.startsWith("/")) {
      return `${process.env.REACT_APP_API_URL || "http://localhost:3000"}${url}`;
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
    setLoadingItems((prev) => ({ ...prev, [id]: false }));
  };

  // Handle download folder as zip
  const handleDownloadFolder = () => {
    return;
    if (!folderId) return;

    // Create a link element and trigger download
    const API_BASE_URL = `${process.env.REACT_APP_API_URL || "http://localhost:3000"}/api`;
    const downloadUrl = `${API_BASE_URL}/folders/${folderId}/download`;

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = ""; // Let the server set the filename
    link.setAttribute("ngrok-skip-browser-warning", "true"); // Add ngrok header
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {folderId && currentItems.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownload />}
            onClick={handleDownloadFolder}
            sx={{
              px: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 1, sm: 1.1, md: 1.2 },
              borderRadius: 3,
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
            }}
          >
            Download All Files
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          margin: { xs: -0.5, sm: -0.75, md: -1.5 },
          mt: 2,
        }}
      >
        {currentItems.map((item, index) => {
          // We only use blob URLs now to prevent duplicate requests
          const isImage = item.type === "photo";

          return (
            <Box
              sx={{
                width: { xs: "50%", sm: "33.33%", md: "25%" },
                p: { xs: 0.5, sm: 0.75, md: 1.5 },
              }}
              key={item.id}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    overflow: "hidden",
                    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
                    "&:hover .media-overlay": { opacity: 1 },
                    "&:hover img, &:hover video": { transform: "scale(1.05)" },
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
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        bgcolor: alpha(theme.palette.background.paper, 0.2),
                      }}
                    />
                  )}

                  {/* Only render media when we have blob URL ready or if loading failed */}
                  {(blobUrls[item.id] || loadingItems[item.id] === false) &&
                    (isImage ? (
                      <CardMedia
                        component="img"
                        src={blobUrls[item.id]}
                        alt={item.originalFilename || "Photo"}
                        sx={{
                          height: { xs: 140, sm: 160, md: 200 },
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                        }}
                        onLoad={() => handleImageLoad(item.id)}
                      />
                    ) : (
                      <CardMedia
                        component="video"
                        src={blobUrls[item.id]}
                        preload="metadata"
                        muted
                        sx={{
                          height: { xs: 140, sm: 160, md: 200 },
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                        }}
                        onLoadedMetadata={() => handleImageLoad(item.id)}
                      />
                    ))}

                  {/* Type indicator */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: 8, sm: 10, md: 12 },
                      left: { xs: 8, sm: 10, md: 12 },
                      zIndex: 2,
                    }}
                  >
                    <Chip
                      icon={
                        isImage ? (
                          <Image fontSize="small" />
                        ) : (
                          <Videocam fontSize="small" />
                        )
                      }
                      label={isImage ? "Image" : "Video"}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.7),
                        backdropFilter: "blur(4px)",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        height: { xs: 20, sm: 22, md: 24 },
                        "& .MuiChip-icon": {
                          color: isImage
                            ? theme.palette.info.main
                            : theme.palette.error.main,
                          marginLeft: "4px",
                        },
                        borderRadius: "6px",
                        border: `1px solid ${alpha("#fff", 0.1)}`,
                      }}
                    />
                  </Box>

                  {/* Overlay with view icon */}
                  <Box
                    className="media-overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `linear-gradient(to top, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                      backdropFilter: "blur(3px)",
                      zIndex: 1,
                    }}
                  >
                    <IconButton
                      sx={{
                        color: "white",
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        backdropFilter: "blur(4px)",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.3),
                        },
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

                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    py: { xs: 1, sm: 1.5, md: 2 },
                    px: { xs: 1, sm: 1.5, md: 2 },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{
                      mb: { xs: 1, sm: 1.5, md: 2 },
                      fontWeight: 600,
                      fontSize: { xs: "0.85rem", sm: "0.875rem", md: "0.9rem" },
                      lineHeight: 1.3,
                    }}
                  >
                    {item.originalFilename || `File_${item.id.substring(0, 8)}`}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: "auto",
                      gap: { xs: 1, sm: 1.5, md: 2 },
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `${getFullUrl(item.url)}`,
                          "_blank",
                        );
                      }}
                      sx={{
                        padding: { xs: 0.75, sm: 0.85, md: 1 },
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      <Download
                        fontSize="small"
                        sx={{ color: theme.palette.primary.main }}
                      />
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
                          "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.2),
                          },
                        }}
                      >
                        <Delete
                          fontSize="small"
                          sx={{ color: theme.palette.error.main }}
                        />
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 4, sm: 6, md: 8 },
            m: { xs: 2, sm: 3, md: 4 },
            borderRadius: 4,
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.4),
          }}
        >
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: "50%",
              p: 2,
              mb: 3,
            }}
          >
            <Image
              sx={{
                fontSize: "3rem",
                color: alpha(theme.palette.primary.main, 0.7),
              }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No media files yet
          </Typography>
          <Typography
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 400 }}
          >
            Upload some files to start building your media collection.
          </Typography>
        </Box>
      )}

      {/* Media viewer dialog */}
      {viewerOpen && (
        <MediaViewer
          items={currentItems}
          currentIndex={currentMediaIndex}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          existingBlobUrls={blobUrls}
          onUpdateBlobUrls={(newBlobUrls) => {
            // Use a function form of setState to avoid dependency on current blobUrls
            // This prevents infinite render loops
            setBlobUrls((prev) => {
              // Check if there are any actual changes
              const hasChanges = Object.entries(newBlobUrls).some(
                ([id, url]) =>
                  prev[id] !== url && url !== null && url !== undefined,
              );

              // Only update state if there are new URLs
              return hasChanges ? { ...prev, ...newBlobUrls } : prev;
            });
          }}
        />
      )}
    </>
  );
}
