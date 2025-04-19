import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, Error, Info, Warning } from "@mui/icons-material";

export type FeedbackType = "success" | "error" | "info" | "warning" | "loading";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: FeedbackType;
  actionText?: string;
  onAction?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onClose,
  title,
  message,
  type,
  actionText,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle color="success" sx={{ fontSize: 60 }} />;
      case "error":
        return <Error color="error" sx={{ fontSize: 60 }} />;
      case "info":
        return <Info color="info" sx={{ fontSize: 60 }} />;
      case "warning":
        return <Warning color="warning" sx={{ fontSize: 60 }} />;
      case "loading":
        return <CircularProgress size={60} />;
      default:
        return <Info color="info" sx={{ fontSize: 60 }} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "success.main";
      case "error":
        return "error.main";
      case "info":
        return "info.main";
      case "warning":
        return "warning.main";
      case "loading":
        return "primary.main";
      default:
        return "primary.main";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={type !== "loading" ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          pb: 0,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            py: 3,
          }}
        >
          {getIcon()}
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        {type !== "loading" && (
          <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
            Close
          </Button>
        )}
        {actionText && onAction && type !== "loading" && (
          <Button
            onClick={onAction}
            variant="contained"
            color={type === "error" ? "error" : "primary"}
          >
            {actionText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
