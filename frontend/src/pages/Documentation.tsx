import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  LockOutlined,
  DeleteOutline,
  UploadFile,
  Download,
  CreateNewFolder,
  AdminPanelSettings,
  Search,
} from '@mui/icons-material';

export default function Documentation() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        MediaVault Documentation
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        Welcome to MediaVault - a secure way to share and manage media files. 
        This guide will help you understand how to use the application effectively.
      </Typography>
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Getting Started
        </Typography>
        
        <List sx={{ mb: 3 }}>
          <ListItem>
            <ListItemIcon>
              <CreateNewFolder color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Creating Folders" 
              secondary="Start by creating a folder to organize your media. Click on 'Create Folder' in the left menu and fill out the form with a name and optional password for protection."
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <UploadFile color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Uploading Media" 
              secondary="Navigate to your folder and use the 'Upload Media' button to select files. You can also drag and drop files directly onto the page."
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Search color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Finding Content" 
              secondary="Use the search functionality to quickly locate folders or specific files within a folder."
            />
          </ListItem>
        </List>
      </Paper>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockOutlined color="primary" />
              Password Protection
            </Typography>
            <Typography variant="body2">
              When creating a folder, you can set a password to restrict access. 
              Users will need to enter this password to view the contents of the folder.
              This provides an extra layer of security for sensitive content.
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Download color="primary" />
              Downloading Files
            </Typography>
            <Typography variant="body2">
              You can download individual files by clicking the download icon on each media item.
              You can also download all media in a folder as a ZIP archive using the "Download All" button.
            </Typography>
          </CardContent>
        </Card>
      </Box>
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings color="primary" />
          Admin Functions
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Important: Only administrators can delete content from the system.
          </Typography>
        </Alert>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          The admin panel provides special functions for system administrators:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <DeleteOutline color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Content Deletion" 
              secondary="Only administrators can delete folders and media. Regular users cannot delete content once uploaded."
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <AdminPanelSettings color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Activity Logs" 
              secondary="Admins can view system logs to monitor all activities including folder creation, media uploads, and deletion events."
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Tips and Best Practices
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <List>
          <ListItem>
            <ListItemText 
              primary="Organize your content" 
              secondary="Create separate folders for different types of media or projects to keep your content organized."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Use descriptive names" 
              secondary="Choose clear, descriptive names for your folders to make them easier to find later."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Secure sensitive content" 
              secondary="Always use password protection for folders containing sensitive or private media."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Contact an admin" 
              secondary="If you need to delete content or have issues accessing the system, contact your system administrator."
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}