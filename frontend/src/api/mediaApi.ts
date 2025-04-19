import { Folder, CreateFolderInput, MediaItem } from "../types";

const API_BASE_URL = `${process.env.REACT_APP_API_URL || "http://localhost:3000"}/api`;

// API functions for the real backend
export async function fetchFolders(): Promise<Folder[]> {
  const response = await fetch(`${API_BASE_URL}/folders`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }
  return response.json();
}

export async function fetchFolder(folderId: string): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch folder details");
  }
  return response.json();
}

export async function createFolder(data: CreateFolderInput): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create folder");
  }

  return response.json();
}

export async function fetchFolderContent(
  folderId: string,
): Promise<MediaItem[]> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}/media`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch folder content");
  }
  return response.json();
}

export async function uploadMedia(
  folderId: string,
  formData: FormData,
): Promise<MediaItem> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}/media`, {
    method: "POST",
    body: formData,
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to upload media");
  }

  return response.json();
}

export async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: "DELETE",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete folder");
  }
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
    method: "DELETE",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete media");
  }
}

export async function verifyFolderPassword(
  folderId: string,
  password: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.verified === true;
  } catch (error) {
    console.error("Error verifying folder password:", error);
    return false;
  }
}
