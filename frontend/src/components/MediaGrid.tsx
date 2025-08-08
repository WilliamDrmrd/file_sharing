import { alpha, Box, Button, Card, CardContent, CardMedia, Chip, IconButton, Typography, useTheme, CircularProgress, } from "@mui/material";
import {Download, FileDownload, Image, Videocam, Visibility,} from "@mui/icons-material";
import {MediaItem} from "../types";
import React, {useEffect, useRef, useState} from "react";
import {deleteMedia} from "../api/mediaApi";
import MediaViewer from "./MediaViewer";
import { getZip } from "../api/mediaApi";
import { io, Socket } from "socket.io-client";

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
  const [loadingItems, setLoadingItems] = useState<{ [key: string]: boolean }>({});
  const [blobUrls, setBlobUrls] = useState<{ [key: string]: string }>({});
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingById, setDownloadingById] = useState<{ [key: string]: boolean }>({});
  const [downloadProgressById, setDownloadProgressById] = useState<{ [key: string]: number }>({});
  const [failedThumbById, setFailedThumbById] = useState<{ [key: string]: boolean }>({});
  // Track last known thumbnail URL per item to decide when to show loading spinner
  const prevThumbnailByIdRef = useRef<{ [key: string]: string | undefined }>({});
  // WebSocket: subscribe to thumbnail updates for videos without thumbnails
  const socketRef = useRef<Socket | null>(null);
  const subscribedFilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000");
    socketRef.current = socket;
    const filesSnapshot: string[] = Array.from(subscribedFilesRef.current);
    return () => {
      // Remove specific listeners we attached
      filesSnapshot.forEach((fileName) => {
        socket.off(`fileProcessed_${fileName}`);
      });
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    currentItems.forEach((item) => {
      if (!item.thumbnailUrl && item.originalFilename) {
        const fileName = item.originalFilename;
        if (!subscribedFilesRef.current.has(fileName)) {
          subscribedFilesRef.current.add(fileName);
          socket.emit("subscribeToFile", fileName);
          const handler = (data: { fileName: string; status: string; thumbnailUrl: string }) => {
            if (data.status === "complete" && data.fileName === fileName) {
              // Update item to include thumbnailUrl
              setCurrentItems((prev) => prev.map((it) => it.id === item.id ? { ...it, thumbnailUrl: data.thumbnailUrl } : it));
              // show overlay spinner until <img> fires onLoad
              setLoadingItems((prev) => ({ ...prev, [item.id]: true }));
              setFailedThumbById((prev) => ({ ...prev, [item.id]: false }));
              // Once processed, no need to keep listening for this file
              socket.off(`fileProcessed_${fileName}`, handler);
            }
          };
          socket.on(`fileProcessed_${fileName}`, handler);
        }
      }
    });
  }, [currentItems]);

  // WebSocket subscribe function intentionally omitted (unused for now)

  useEffect(() => {
    setCurrentItems(items);
    // Only set loading=true for items whose thumbnailUrl just appeared/changed
    setLoadingItems((prev) => {
      const next: { [key: string]: boolean } = { ...prev };
      const seenIds = new Set<string>();
      items.forEach((it) => {
        seenIds.add(it.id);
        const prevThumb = prevThumbnailByIdRef.current[it.id];
        if (it.thumbnailUrl && it.thumbnailUrl !== prevThumb) {
          next[it.id] = true;
        }
      });
      // Cleanup loading flags for items no longer present
      Object.keys(next).forEach((id) => {
        if (!seenIds.has(id)) delete next[id];
      });
      // Update ref snapshot of thumbnails
      const snapshot: { [key: string]: string | undefined } = {};
      items.forEach((it) => {
        snapshot[it.id] = it.thumbnailUrl;
      });
      prevThumbnailByIdRef.current = snapshot;
      return next;
    });
  }, [items]);

  // Removed background blob fetching to reduce CPU/memory. Images use direct URLs with browser caching.

  const handleDelete = async (mediaId: string) => {
    try {
      const sure = window.confirm("Are you sure you want to delete this file?");
      if (!sure) return;
      const deletedBy = window.prompt("Enter your name (optional):") || undefined;
      await deleteMedia(mediaId, deletedBy);
      setCurrentItems(currentItems.filter((item) => item.id !== mediaId));
    } catch (error) {
      console.error("Error deleting media:", error);
    }
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

  async function downloadBlob(blobOrUrl: Blob | string, filename: string = 'download'): Promise<void> {
    let blob: Blob;

    if (typeof blobOrUrl === 'string') {
      // Fetch the Blob from the Blob URL
      const response = await fetch(blobOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Blob from URL: ${response.statusText}`);
      }
      blob = await response.blob();
    } else {
      // Use the Blob directly
      blob = blobOrUrl;
    }

    // Create a Blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // Append the anchor to the document body
    document.body.appendChild(link);

    // Programmatically trigger a click on the anchor
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );

    // Clean up: remove the anchor and revoke the Blob URL after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 100);
  }

  // Handle download folder as zip
  const handleDownloadFolder = async () => {
    if (!folderId) {
      console.error("Folder ID is required to download the folder");
      return;
    }
    setDownloadingZip(true);
    const zipFileName = await getZip(folderId);
    downloadFile(zipFileName, zipFileName);
    setDownloadingZip(false);
  };

  function downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleDownload (item: MediaItem) {
    try {
      setDownloadingById((prev) => ({ ...prev, [item.id]: true }));
      setDownloadProgressById((prev) => ({ ...prev, [item.id]: 0 }));

      // If we already cached, just download
      if (blobUrls[item.id]) {
        await downloadBlob(blobUrls[item.id], item.originalFilename);
        return;
      }

      // Stream download with progress
      const response = await fetch(item.url);
      if (!response.ok || !response.body) {
        throw new Error('Failed to fetch file');
      }
      const contentLengthHeader = response.headers.get('content-length');
      const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytesReceived = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          bytesReceived += value.length;
          if (total) {
            const progress = (bytesReceived / total) * 100;
            setDownloadProgressById((prev) => ({ ...prev, [item.id]: progress }));
          }
        }
      }
      const all = new Uint8Array(bytesReceived);
      let position = 0;
      for (const chunk of chunks) {
        all.set(chunk, position);
        position += chunk.length;
      }
      const mimeType = item.type === 'photo' ? 'image/jpeg' : 'video/mp4';
      const blob = new Blob([all], { type: mimeType });
      await downloadBlob(blob, item.originalFilename);
    } catch (err) {
      console.error('Error downloading file:', err);
    } finally {
      setDownloadingById((prev) => ({ ...prev, [item.id]: false }));
      setDownloadProgressById((prev) => ({ ...prev, [item.id]: 0 }));
    }
  }

  return (
    <>
      {folderId && currentItems.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={downloadingZip ? (
              <CircularProgress size={16} color="inherit" />
            ) : <FileDownload />}
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
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: { xs: 1, sm: 1.5, md: 2 },
          mt: 2,
          width: "100%",
        }}
      >
        {currentItems.map((item, index) => {
          // We only use blob URLs now to prevent duplicate requests
          const isImage = item.type === "photo";

          return (
            <Box
              sx={{
                width: "100%",
                p: 0,
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
                  <Box sx={{ position: 'relative', height: { xs: 140, sm: 160, md: 200 },}}>
                    {isImage ? (
                      item.thumbnailUrl && !failedThumbById[item.id] ? (
                        <CardMedia
                          component="img"
                          src={item.thumbnailUrl}
                          loading="lazy"
                          sx={{
                            height: { xs: 140, sm: 160, md: 200 },
                            objectFit: 'cover',
                            transition: 'opacity 0.3s ease',
                          }}
                          onLoad={() => handleImageLoad(item.id)}
                          onError={() => {
                            setFailedThumbById((prev) => ({ ...prev, [item.id]: true }));
                            setLoadingItems((prev) => ({ ...prev, [item.id]: false }));
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: { xs: 140, sm: 160, md: 200 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.background.paper, 0.3),
                          }}
                        >
                          <Image sx={{ color: alpha('#fff', 0.8) }} />
                        </Box>
                      )
                    ) : (
                      item.thumbnailUrl && !failedThumbById[item.id] ? (
                        <CardMedia
                          component="img"
                          src={item.thumbnailUrl}
                          loading="lazy"
                          sx={{
                            height: { xs: 140, sm: 160, md: 200 },
                            objectFit: 'cover',
                            transition: 'opacity 0.3s ease',
                          }}
                          onLoad={() => handleImageLoad(item.id)}
                          onError={() => {
                            setFailedThumbById((prev) => ({ ...prev, [item.id]: true }));
                            setLoadingItems((prev) => ({ ...prev, [item.id]: false }));
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: { xs: 140, sm: 160, md: 200 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.background.paper, 0.3),
                          }}
                        >
                          <Videocam sx={{ color: alpha('#fff', 0.8) }} />
                        </Box>
                      )
                    )}
                    {loadingItems[item.id] && item.thumbnailUrl && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.15)',
                          zIndex: 2,
                        }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    {/* Download progress overlay */}
                    {downloadingById[item.id] && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          zIndex: 3,
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <CircularProgress variant={Number.isFinite(downloadProgressById[item.id]) ? 'determinate' : 'indeterminate'} value={downloadProgressById[item.id] || 0} />
                          {Number.isFinite(downloadProgressById[item.id]) && (
                            <Typography variant="caption" color="white">{Math.round(downloadProgressById[item.id])}%</Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>

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
                      justifyContent: "flex-end",
                      alignItems: "center",
                      mt: "auto",
                      gap: { xs: 1, sm: 1.5, md: 2 },
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        //TODO finish this.
                        e.stopPropagation();
                        // TODO here we must check if we already have the blob, otherwise
                        //  urgently launch a fetch for it and make a loader in the front.
                        //  ==> actually I think this is done now, need to check if it works
                        handleDownload(item);
                      }}
                      sx={{
                        padding: { xs: 0.75, sm: 0.85, md: 1 },
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      {downloadingById[item.id] ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Download
                          fontSize="small"
                          sx={{ color: theme.palette.primary.main }}
                        />
                      )}
                    </IconButton>
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
          handleDelete={handleDelete}
          handleDownload={handleDownload}
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
