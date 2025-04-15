import { useState, useEffect } from "react";
import { fetchFolders, createFolder } from "../api/mediaApi";
import { Folder, CreateFolderInput } from "../types";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders().then(f => {
      setFolders(f);
      setLoading(false);
    });
  }, []);

  const addFolder = async (input: CreateFolderInput) => {
    const newFolder = await createFolder(input);
    setFolders(prev => [newFolder, ...prev]);
  };

  return { folders, loading, addFolder };
}