import React, {useEffect, useRef, useState} from "react";
import {Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Typography,} from "@mui/material";
import {ArrowBack, ArrowForward, Close, Delete, Download, Fullscreen, FullscreenExit} from "@mui/icons-material";
import {MediaItem} from "../types";
import ExifReader from "exifreader";

interface MediaViewerProps {
  items: MediaItem[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  handleDelete: (id: string) => Promise<void>;
  handleDownload: (item: MediaItem) => Promise<void>;
  existingBlobUrls?: { [key: string]: string };
  onUpdateBlobUrls?: (urls: { [key: string]: string }) => void;
}

export default function MediaViewer({
  items,
  currentIndex,
  open,
  onClose,
  handleDelete,
  handleDownload,
  existingBlobUrls = {},
  onUpdateBlobUrls,
}: MediaViewerProps) {
  const [index, setIndex] = useState(currentIndex);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentDownloadProgress, setCurrentDownloadProgress] = useState<number>(0);
  const [currentDownloadTotal, setCurrentDownloadTotal] = useState<number>(0);
  const [currentDownloadLoaded, setCurrentDownloadLoaded] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [blobUrls, setBlobUrls] = useState<{ [key: string]: string }>(
    existingBlobUrls,
  );
  const pendingRequestsRef = useRef(new Map<string, Promise<string | null>>());
  const creationDatesRef = useRef<{ [key: string]: string }>({});

  // Reset the index when items or currentIndex changes
  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex, items]);

  // Handle media loading when the view needs to display an item
  useEffect(() => {
    // Only run when viewer is open
    if (!open || items.length === 0 || !items[index]) return;

    // Get current item
    const currentItem = items[index];

    async function getPhotoMetadata(blob: Blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);

      return tags.DateTimeOriginal?.description || "";
    }

    // Function to fetch a media item
    const fetchMediaItem = async (item: MediaItem): Promise<string | null> => {
      // Avoid duplicate requests
      if (pendingRequestsRef.current.has(item.id)) {
        return pendingRequestsRef.current.get(item.id) as Promise<string | null>;
      }

      // Create and store the promise
      const fetchPromise = (async () => {
        try {
          // Reset download progress
          setCurrentDownloadProgress(0);
          setCurrentDownloadLoaded(0);
          setCurrentDownloadTotal(0);
          setIsDownloading(true);

          // Use the fetch API with a reader to track progress
          const response = await fetch(item.url);

          if (!response.ok) {
            throw new Error(`Failed to fetch media: ${response.statusText}`);
          }

          // Get total size from content-length header
          const contentLength = response.headers.get('content-length');
          const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
          setCurrentDownloadTotal(totalSize);

          // Create a reader from the response body
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('ReadableStream not supported');
          }

          // Read the data chunks
          const chunks: Uint8Array[] = [];
          let receivedLength = 0;

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            chunks.push(value);
            receivedLength += value.length;

            // Update progress
            setCurrentDownloadLoaded(receivedLength);
            if (totalSize) {
              setCurrentDownloadProgress(Math.round((receivedLength / totalSize) * 100));
            }
          }

          // Concatenate chunks into a single Uint8Array
          const chunksAll = new Uint8Array(receivedLength);
          let position = 0;
          for (const chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
          }

          // Create a blob and get URL
          const mimeType = item.type === 'photo' ? 'image/jpeg' : 'video/mp4';
          const blob = new Blob([chunksAll], { type: mimeType });
          try {
            if (item.type === 'photo')
              creationDatesRef.current[item.id] = await getPhotoMetadata(blob);
          } catch (error) {}
          const blobUrl = URL.createObjectURL(blob);

          setCurrentDownloadProgress(100);
          return blobUrl;
        } catch (error) {
          console.error(`Error fetching item (${item.id}):`, error);
          return null;
        } finally {
          setIsDownloading(false);
          pendingRequestsRef.current.delete(item.id);
        }
      })();

      pendingRequestsRef.current.set(item.id, fetchPromise);
      return fetchPromise;
    };

    const preloadAdjacentItems = async () => {
      // Preload adjacent items for smooth navigation
      const adjacentItems: MediaItem[] = [];

      // Next item
      if (index < items.length - 1) {
        const nextItem = items[index + 1];
        if (!blobUrls[nextItem.id] && !existingBlobUrls[nextItem.id])
          adjacentItems.push(nextItem);
      }

      // Previous item
      if (index > 0) {
        const prevItem = items[index - 1];
        if (!blobUrls[prevItem.id] && !existingBlobUrls[prevItem.id])
          adjacentItems.push(prevItem);
      }

      // Load adjacent items - but one by one to avoid conflicts with the progress tracking
      // This is a compromise - we won't load in parallel to keep the progress indicator accurate
      if (adjacentItems.length > 0) {
        // We don't need to await these - they can load in background
        (async () => {
          for (const item of adjacentItems) {
            try {
              // Only try to load if we're not already loading something else
              if (!isDownloading) {
                const itemUrl = await fetchMediaItem(item);
                if (itemUrl) {
                  setBlobUrls((prev) => ({
                    ...prev,
                    [item.id]: itemUrl,
                  }));
                }
              }
            } catch (err) {
              console.error(`Error preloading item ${item.id}:`, err);
            }
          }
        })().catch((err) => {
          console.error("Error in preload process:", err);
        });
      }
    }

    // If we already have this item loaded in either blob URL state or from existingBlobUrls, just clear loading
    if (blobUrls[currentItem.id] || existingBlobUrls[currentItem.id]) {
      setLoading(false);
      preloadAdjacentItems();
      return;
    }

    // Set loading state when navigation happens
    setLoading(true);

    // Load current item first, then adjacent items
    const loadItems = async () => {
      try {
        // If we don't have the current item, load it
        if (!blobUrls[currentItem.id] && !existingBlobUrls[currentItem.id]) {
          const currentItemUrl = await fetchMediaItem(currentItem);

          if (currentItemUrl) {
            setBlobUrls((prev) => ({
              ...prev,
              [currentItem.id]: currentItemUrl,
            }));
          }
        }

        // Clear loading state for current item
        setLoading(false);
      } catch (error) {
        console.error("Error loading media items:", error);
        setLoading(false);
      }
    };

    loadItems();

    // No cleanup needed here - we'll handle cleanup when viewer closes
    return () => {};
  }, [items, open, index, blobUrls, existingBlobUrls]);

  // Handle callback when viewer is closed
  const previousOpenRef = React.useRef(open);

  useEffect(() => {
    // Only run when the viewer is being closed (was open, now closed)
    if (previousOpenRef.current && !open && onUpdateBlobUrls) {
      // When closing, pass all blob URLs back to the parent
      onUpdateBlobUrls({ ...blobUrls });
    }

    // Update ref for next render
    previousOpenRef.current = open;

    // Component unmount cleanup
    return () => {
      // We're not going to revoke blob URLs here anymore
      // Instead, we'll let the parent component (MediaGrid) manage their lifecycle
    };
  }, [open, onUpdateBlobUrls]);
  // Intentionally NOT including blobUrls in deps to avoid update loops

  const currentItem = items[index];

  // Ensure we have a valid blob URL for the current item
  const mediaSrc =
    blobUrls[currentItem?.id] || existingBlobUrls[currentItem?.id];

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
    if (e.key === "ArrowLeft") {
      if (index > 0) {
        setIndex(index - 1);
        setLoading(true);
      }
    } else if (e.key === "ArrowRight") {
      if (index < items.length - 1) {
        setIndex(index + 1);
        setLoading(true);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Add keyboard listener when dialog is open
  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, index, items.length]);

  // Handle fullscreen toggle
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreen(!fullscreen);
  };

  // Handle download
  const downloadFile = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentItem) return;

    try {
      setDownloading(true);
      await handleDownload(currentItem);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteInView = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeleting(true);
      await handleDelete(currentItem.id);
      setDeleting(false);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

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
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "black",
          overflow: "hidden",
          height: fullscreen ? "100vh" : "90vh",
          width: fullscreen ? "100vw" : "90vw",
        }}
      >
        {/* Close button */}
        <IconButton
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            color: "white",
            bgcolor: "rgba(0,0,0,0.5)",
          }}
          onClick={onClose}
        >
          <Close />
        </IconButton>

        {/* Media content */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                width: "80%",
                maxWidth: "400px"
              }}
            >
              {isDownloading && currentDownloadTotal > 0 ? (
                <>
                  <CircularProgress
                    variant="determinate"
                    value={currentDownloadProgress}
                    size={60}
                  />
                  <Typography variant="body2" color="white">
                    {currentDownloadProgress}% ({(currentDownloadLoaded / 1024 / 1024).toFixed(1)} MB / {(currentDownloadTotal / 1024 / 1024).toFixed(1)} MB)
                  </Typography>
                </>
              ) : (
                <CircularProgress />
              )}
            </Box>
          )}

          {/* Only show media once blob URL is ready */}
          {mediaSrc &&
            (currentItem.type === "photo" ? (
              <img
                src={mediaSrc}
                alt="Media preview"
                style={{
                  position: "absolute",
                  top: 0,
                  maxWidth: "100%",
                  maxHeight: "calc(100% - 60px)",
                  objectFit: "contain",
                  opacity: loading ? 0.3 : 1,
                  transition: "opacity 0.3s ease",
                  zIndex: 1,
                }}
                onLoad={handleMediaLoaded}
              />
            ) : (
              <video
                src={mediaSrc}
                controls
                autoPlay
                preload="auto"
                style={{
                  position: "absolute",
                  top: 0,
                  maxWidth: "100%",
                  maxHeight: "calc(100% - 60px)",
                  opacity: loading ? 0.3 : 1,
                  transition: "opacity 0.3s ease",
                  zIndex: 1,
                }}
                onLoadedMetadata={handleMediaLoaded}
              />
            ))}

          {/* Navigation buttons */}
          {index > 0 && (
            <IconButton
              onClick={goToPrevious}
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.5)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                zIndex: 2,
              }}
            >
              <ArrowBack />
            </IconButton>
          )}

          {index < items.length - 1 && (
            <IconButton
              onClick={goToNext}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.5)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                zIndex: 2,
              }}
            >
              <ArrowForward />
            </IconButton>
          )}

          {/* Bottom toolbar */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 1,
              p: 2,
              bgcolor: "rgba(0,0,0,0.7)",
              zIndex: 10,
              height: "60px",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                pr: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" color="white">
                {index + 1} / {items.length}{currentItem.type === "photo" ? " | Created: " : ""} {creationDatesRef.current[currentItem.id]}
              </Typography>
              {currentItem.originalFilename && (
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ opacity: 0.8, mt: 0.5, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
                >
                  {currentItem.originalFilename}
                </Typography>
              )}
            </Box>

            {/* Controls for sm and up: full buttons */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", flexShrink: 0 }}>
              <Button
                startIcon={
                  deleting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Delete />
                  )
                }
                onClick={handleDeleteInView}
                disabled={deleting}
                sx={{ color: "red", mr: 1 }}
              >
                Delete
              </Button>

              <Button
                startIcon={
                  downloading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Download />
                  )
                }
                onClick={downloadFile}
                disabled={downloading}
                sx={{ color: "white", mr: 1 }}
              >
                Download
              </Button>

              <IconButton onClick={toggleFullscreen} sx={{ color: "white" }}>
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Box>

            {/* Controls for xs: compact icon buttons */}
            <Box sx={{ display: { xs: "flex", sm: "none" }, alignItems: "center", gap: 1, ml: "auto", flexShrink: 0 }}>
              <IconButton onClick={handleDeleteInView} disabled={deleting} sx={{ color: "red" }} aria-label="Delete">
                {deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
              </IconButton>
              <IconButton onClick={downloadFile} disabled={downloading} sx={{ color: "white" }} aria-label="Download">
                {downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
              </IconButton>
              <IconButton onClick={toggleFullscreen} sx={{ color: "white" }} aria-label="Fullscreen">
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
