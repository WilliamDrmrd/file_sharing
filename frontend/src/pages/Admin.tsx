import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Collapse,
  Paper,
  TextField,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useFolders } from "../hooks/useFolders";
import { deleteFolder, deleteMedia, fetchFolderContent } from "../api/mediaApi";

interface LogEntry {
  id: string;
  action: string;
  details: string | null;
  entityId: string | null;
  createdAt: string;
  level: 'info' | 'warn' | 'error';
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { folders, loading: foldersLoading } = useFolders();
  const [openIds, setOpenIds] = useState<{ [folderId: string]: boolean }>({});
  const [folderContents, setFolderContents] = useState<{ [folderId: string]: any[] }>({});

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting admin login with password:', password);
      
      // Remove hardcoded password
      
      const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ password }),
      });
      
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Invalid password');
      }
      
      const data = await response.json();
      console.log('Login response data:', data);
      
      localStorage.setItem('adminToken', data.token);
      setIsAuthenticated(true);
      
      // Load initial data
      fetchLogs();
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLogs = async () => {
    setLoading(true);
    
    try {
      console.log('Fetching logs with admin token');
      
      const token = localStorage.getItem('adminToken');
      // Fetch logs
      // For debugging, log the token
      console.log("Using admin token for logs:", token);
      
      const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
      const logsResponse = await fetch(`${API_BASE_URL}/admin/logs`, {
        headers: {
          'x-admin-token': token || 'admin-authenticated',
          'ngrok-skip-browser-warning': 'true'
        },
      });
      
      console.log('Logs response status:', logsResponse.status);
      
      if (!logsResponse.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const logsData = await logsResponse.json();
      console.log('Logs data:', logsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isAuthenticated) {
        // Use the admin delete endpoint for authenticated users
        const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
        await fetch(`${API_BASE_URL}/admin/folders/${id}`, {
          method: 'DELETE',
          headers: {
            'x-admin-token': 'admin-authenticated',
            'ngrok-skip-browser-warning': 'true'
          },
        });
      } else {
        // Use the regular delete endpoint
        await deleteFolder(id);
      }
      
      window.location.reload();
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError('Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const handleShowMedia = async (id: string) => {
    if (folderContents[id]) {
      setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
      return;
    }
    const media = await fetchFolderContent(id);
    setFolderContents((prev) => ({ ...prev, [id]: media }));
    setOpenIds((prev) => ({ ...prev, [id]: true }));
  };

  const handleDeleteMedia = async (mediaId: string, folderId: string) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isAuthenticated) {
        // Use the admin delete endpoint for authenticated users
        const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api`;
        await fetch(`${API_BASE_URL}/admin/media/${mediaId}`, {
          method: 'DELETE',
          headers: {
            'x-admin-token': 'admin-authenticated',
            'ngrok-skip-browser-warning': 'true'
          },
        });
      } else {
        // Use the regular delete endpoint
        await deleteMedia(mediaId);
      }
      
      setFolderContents((prev) => ({
        ...prev,
        [folderId]: prev[folderId].filter((m: any) => m.id !== mediaId)
      }));
    } catch (error) {
      console.error('Error deleting media:', error);
      setError('Failed to delete media');
    } finally {
      setLoading(false);
    }
  };

  // Check if admin is already authenticated
  useEffect(() => {
    // Clear any existing token on component mount
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Admin Panel
      </Typography>
      
      {!isAuthenticated ? (
        <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Admin Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Admin Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
          />
          
          <Button 
            variant="contained" 
            onClick={handleLogin} 
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </Paper>
      ) : (
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Paper>
            <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
              <Tab label="Folders" />
              <Tab label="Logs" />
            </Tabs>
            
            <Divider />
            
            <Box sx={{ p: 3 }}>
              {loading || foldersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : tab === 0 ? (
                // Folders tab
                <List>
                  {folders.map(folder => (
                    <Box key={folder.id} mb={2}>
                      <ListItem
                        secondaryAction={
                          <>
                            <Button color="error" onClick={() => handleDeleteFolder(folder.id)}>
                              Delete Folder
                            </Button>
                            <Button onClick={() => handleShowMedia(folder.id)}>
                              {openIds[folder.id] ? "Hide Media" : "Show Media"}
                            </Button>
                          </>
                        }
                      >
                        <ListItemText primary={folder.name} secondary={`By ${folder.createdBy}`} />
                      </ListItem>
                      <Collapse in={openIds[folder.id]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {(folderContents[folder.id] || []).map((media: any) => (
                            <ListItem key={media.id} sx={{ pl: 4 }}>
                              <ListItemText
                                primary={media.type === "photo" ? "Photo" : "Video"}
                                secondary={
                                  <>
                                    {media.originalFilename && <div><strong>{media.originalFilename}</strong></div>}
                                    <div>{media.url}</div>
                                  </>
                                }
                              />
                              <Button color="error" onClick={() => handleDeleteMedia(media.id, folder.id)}>
                                Delete
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </Box>
                  ))}
                </List>
              ) : (
                // Logs tab
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Entity ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              color: 
                                log.level === 'error' ? 'error.main' :
                                log.level === 'warn' ? 'warning.main' :
                                'success.main',
                              fontWeight: log.level === 'error' ? 700 : 400
                            }}
                          >
                            {log.level.toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.details || '-'}</TableCell>
                        <TableCell>{log.entityId || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}