import { api } from "../api";
import { PathResponse } from "../components/FileUpload";
import { getFiles } from "../hooks/useUploadedFIles";

export const postFiles = async (formData: FormData) => {
  const res = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data: PathResponse = res.data;

  if (!data.success) {
    throw new Error("Failed to Upload a file");
  }
//   await getFiles()

  return;
};
