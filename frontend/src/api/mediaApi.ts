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
      "x-folder-password": sessionStorage.getItem(`folder:${folderId}:password`) || "",
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
  onProgress?: (progress: number) => void
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
        "x-folder-password": sessionStorage.getItem(`folder:${folderId}:password`) || "",
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

  try {
    const totalFiles = data.length;
    let completedFiles = 0;
    
    const uploadPromises = data.map((item, i) => {
      return fetch(item.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": item.contentType,
        },
        body: files[i],
      })
        .then(async response => {
          if (!response.ok) {
            throw new Error(`Upload failed for ${item.signedUrl}: ${response.status} ${response.statusText}`);
          }
          console.log(`File ${item.signedUrl} uploaded successfully`);
          try {
            const finalResponse = await fetch(
              `${API_BASE_URL}/folders/${folderId}/media/uploadComplete`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-folder-password": sessionStorage.getItem(`folder:${folderId}:password`) || "",
                },
                body: JSON.stringify({
                  folderId: folderId,
                  type: item.type,
                  uploadedBy: "user",
                  filename: item.filename,
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
          completedFiles++;
          if (onProgress) {
            onProgress((completedFiles / totalFiles) * 100);
          }
          return response; // Important: Return the response to make the promise resolve
        })
        .catch(error => {
          console.error(`Error uploading ${item.signedUrl}:`, error);
          throw error; // Re-throw the error to reject Promise.all
        });
    });

    await Promise.all(uploadPromises);

    console.log("All files uploaded successfully!");

  } catch (error) {
    console.error("An error occurred during the upload process:", error);
    // Handle the error appropriately - potentially retry, inform the user, etc.
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
    const ok = data.verified === true;
    if (ok) {
      sessionStorage.setItem(`folder:${folderId}:password`, password);
    }
    return ok;
  } catch (error) {
    console.error("Error verifying folder password:", error);
    return false;
  }
}

export async function getZip(folderId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/folders/getZip/${folderId}`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true",
      "x-folder-password": sessionStorage.getItem(`folder:${folderId}:password`) || "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get zip");
  }
  const {zipFileName} = await response.json() as {zipFileName: string};
  return zipFileName;
}
