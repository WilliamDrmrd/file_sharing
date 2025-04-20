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
  files: FileList,
): Promise<MediaItem[]> {
  let requestArray: {
    filename: string;
    contentType: string;
    type: "photo" | "video";
    uploadedBy: string;
  }[] = [];
  for (const file of Array.from(files)) {
    const filename = file.name;
    const contentType = file.type;
    const type: "photo" | "video" = contentType.startsWith("image/")
      ? "photo"
      : "video";
    requestArray.push({ filename, contentType, type, uploadedBy: "user" });
  }

  const response = await fetch(
    `${API_BASE_URL}/folders/${folderId}/media/generateSignedUrls`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestArray),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error: ${error.message || response.statusText}`);
  }
  const data: {
    signedUrl: string;
    filename: string;
    contentType: string;
    type: string;
  }[] = await response.json();
  let finalResponses: MediaItem[] = [];

  for (let i = 0; i < data.length; i++) {
    try {
      await fetch(data[i].signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": data[i].contentType,
        },
        body: files[i],
      });

      console.log("File uploaded successfully");

      const finalResponse = await fetch(
        `${API_BASE_URL}/folders/${folderId}/media/uploadComplete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderId: folderId,
            type: data[i].type,
            uploadedBy: "user",
            filename: data[i].filename,
          }),
        },
      );
      if (!finalResponse.ok) {
        const error = await finalResponse.json();
        throw new Error(`Error: ${error.message || finalResponse.statusText}`);
      }
      const mediaItem: MediaItem = await finalResponse.json();
      finalResponses.push(mediaItem);
      console.log("Upload confirmation sent to backend");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }
  return finalResponses;
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
