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
        SnapShare Documentation
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        Welcome to SnapShare - the perfect way to share high-quality memories with friends. 
        No compression, no quality loss, just your beautiful photos and videos exactly as they were taken.
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
              primary="Creating Shared Collections" 
              secondary="Start by creating a folder for your trip or event. Click on 'Create Folder' in the left menu and give it a name like 'Summer Trip 2025' or 'Sarah's Wedding'."
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <UploadFile color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Sharing Your Best Shots" 
              secondary="Add your photos and videos in their original quality. Just navigate to your folder and use the 'Upload Media' button or drag and drop files directly onto the page. Share the link with your friends so they can add theirs too!"
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
              Private Group Sharing
            </Typography>
            <Typography variant="body2">
              Keep your memories private by optionally adding a password to your folder.
              Perfect for sharing with just your close friends from a trip or event without making content public.
              Simply share the password with your group along with the link.
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Download color="primary" />
              Full Quality Downloads
            </Typography>
            <Typography variant="body2">
              Download any photo or video in its original, uncompressed quality by clicking the download icon.
              Want all the memories from a trip? Just use the "Download All" button to get everything in a ZIP archive.
              No quality loss like on social media!
            </Typography>
          </CardContent>
        </Card>
      </Box>
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings color="primary" />
          Event Organizer Tools
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Note: Only event organizers (admins) can remove photos to prevent accidental deletions.
          </Typography>
        </Alert>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          For group trip organizers and event hosts, the admin panel provides special functions:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <DeleteOutline color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Memory Management" 
              secondary="As an event organizer, you can curate the collection by removing duplicates or unwanted images. Only admins can remove content to prevent accidental deletions."
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <AdminPanelSettings color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Group Activity" 
              secondary="See who's contributing to the collection and what's being added. Great for making sure everyone from the trip or event has shared their best shots."
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Tips For Group Sharing
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <List>
          <ListItem>
            <ListItemText 
              primary="Create event collections" 
              secondary="Make a new folder for each trip, wedding, concert, or gathering so memories stay organized by event."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Share with your crew" 
              secondary="Send the folder link to your friends so everyone can contribute their photos and videos to the same collection."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Enjoy full quality" 
              secondary="Unlike social media, your 4K videos and high-res photos remain exactly as they were captured - perfect for reliving those special moments."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Create memories together" 
              secondary="The more friends who contribute, the more complete your collection of memories becomes - everyone gets to see perspectives they missed!"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}