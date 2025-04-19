export interface Folder {
  id: string;
  name: string;
  createdBy: string;
  password?: string;
  createdAt: string;
  mediaCount: number;
}

export interface MediaItem {
  id: string;
  folderId: string;
  url: string;
  type: "photo" | "video";
  uploadedAt: string;
  uploadedBy: string;
  originalFilename?: string;
}

export interface CreateFolderInput {
  name: string;
  createdBy: string;
  password?: string;
}
