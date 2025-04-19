import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  Card,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useFolders } from "../hooks/useFolders";
import {
  CreateNewFolder,
  Lock,
  Visibility,
  VisibilityOff,
  Person,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FeedbackModal from "../components/FeedbackModal";

export default function Create() {
  const { addFolder } = useFolders();
  const [name, setName] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  // Modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "success" | "error" | "loading"
  >("loading");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setFeedbackOpen(true);
      setFeedbackType("loading");
      setFeedbackMessage("Creating your folder...");

      await addFolder({
        name,
        createdBy,
        password: isPrivate ? password : undefined,
      });

      // Success
      setFeedbackType("success");
      setFeedbackMessage("Folder created successfully!");

      // Reset form
      setName("");
      setCreatedBy("");
      setPassword("");
    } catch (error) {
      // Error
      setFeedbackType("error");
      setFeedbackMessage("Failed to create folder. Please try again.");
      console.error("Error creating folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseFeedback = () => {
    setFeedbackOpen(false);
    if (feedbackType === "success") {
      navigate("/folders");
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Create New Folder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new folder to store and share your photos and videos.
        </Typography>
      </Box>

      <Card
        sx={{
          maxWidth: 600,
          p: 3,
          borderRadius: 4,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          background: `linear-gradient(145deg, 
            ${alpha(theme.palette.background.paper, 0.9)}, 
            ${alpha(theme.palette.background.paper, 0.95)})`,
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              mr: 2,
            }}
          >
            <CreateNewFolder fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Folder Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in the information below to create your folder
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, opacity: 0.2 }} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              required
              label="Folder Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Enter a name for your folder"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreateNewFolder color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              required
              label="Your Name"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Enter your name"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    color="primary"
                  />
                }
                label="Make this folder private with password protection"
              />
            </Box>

            {isPrivate && (
              <TextField
                required={isPrivate}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                variant="outlined"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ mx: 2 }} />
                ) : (
                  "Create Folder"
                )}
              </Button>
            </Box>
          </Stack>
        </form>
      </Card>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={handleCloseFeedback}
        title={
          feedbackType === "success"
            ? "Success!"
            : feedbackType === "error"
              ? "Error"
              : "Creating Folder"
        }
        message={feedbackMessage}
        type={feedbackType}
        actionText={feedbackType === "success" ? "Go to Folders" : undefined}
        onAction={
          feedbackType === "success" ? () => navigate("/folders") : undefined
        }
      />
    </Box>
  );
}
