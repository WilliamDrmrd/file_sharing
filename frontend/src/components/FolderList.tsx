import { Card, CardContent, Typography, CardActionArea } from "@mui/material";
import { Box } from "@mui/material";
import { Folder as FolderIcon } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { Folder } from "../types";

interface Props {
  folders: Folder[];
}

export default function FolderList({ folders }: Props) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", margin: -1 }}>
      {folders.map((folder) => (
        <Box
          sx={{ width: { xs: "100%", sm: "50%", md: "33.33%" }, p: 1 }}
          key={folder.id}
        >
          <Card>
            <CardActionArea component={Link} to={`/folders/${folder.id}`}>
              <CardContent>
                <FolderIcon sx={{ fontSize: 40, color: "primary.main" }} />
                <Typography variant="h6">{folder.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Creator: {folder.createdBy}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {folder.mediaCount} items
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      ))}
    </Box>
  );
}
