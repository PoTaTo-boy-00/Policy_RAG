import { useQuery } from "@tanstack/react-query";
import { DocResponse, DocType } from "../components/FileUpload";
import { api } from "../api";
export const getFiles = async () => {
  const res = await api.get("/records");
// console.log(res)
  const data: DocResponse = res.data;

  if (!data.success) {
    throw new Error("Failed to fetch files");
  }
//   console.log("[GET FILES HOOK]",data.response)

  return data.response.map((d) => ({
    id: d.id,
    name: d.name,
    allowed: d.allowed,
    isDeleted: d.isDeleted,
  }));
};


export const useUploadedFiles = () => {
  return useQuery<DocType[]>({
    queryKey: ["uploaded-files"],
    queryFn: getFiles,
  });
};
