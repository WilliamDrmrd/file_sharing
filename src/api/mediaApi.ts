import { Folder, CreateFolderInput, MediaItem } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

// API functions for the real backend
export async function fetchFolders(): Promise<Folder[]> {
  const response = await fetch(`${API_BASE_URL}/folders`);
  if (!response.ok) {
    throw new Error('Failed to fetch folders');
  }
  return response.json();
}

export async function createFolder(data: CreateFolderInput): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create folder');
  }
  
  return response.json();
}

export async function fetchFolderContent(folderId: string): Promise<MediaItem[]> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}/media`);
  if (!response.ok) {
    throw new Error('Failed to fetch folder content');
  }
  return response.json();
}

export async function uploadMedia(folderId: string, formData: FormData): Promise<MediaItem> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}/media`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload media');
  }
  
  return response.json();
}

export async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete folder');
  }
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete media');
  }
}