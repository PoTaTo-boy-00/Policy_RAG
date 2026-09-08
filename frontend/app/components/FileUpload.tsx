
"use client";

import React, { useState } from "react";
import { api } from "../api";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export interface PathResponse {
  success: boolean;
  pathIds: PathIdItem[];
}

export interface PathIdItem {
  id: string;
}

const postFiles = async (formData: FormData) => {
  const res = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data: PathResponse = res.data;

  if (!data.success) {
    throw new Error("Failed to Upload a file");
  }

  return data.pathIds.map((path) => path.id);
};

const FileUpload = () => {
  const queryClient = useQueryClient();

  const [file, setFile] = useState<FileList | null>(null);
  const [filePaths, setFilePaths] = useState<string[]>([]);

  const uploadMutation = useMutation({
    mutationFn: postFiles,

    onSuccess: (newIds) => {
      setFilePaths((prev) => {
        console.log("OLD:", prev);
        console.log("NEW:", newIds);

        return [...prev, ...newIds];
      });

      queryClient.setQueryData<string[]>(
        ["uploaded-files"],
        (oldIds = []) => {
          return [...oldIds, ...newIds];
        }
      );
    },

    onError: (error) => {
      console.error("Upload failed:", error);
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      setFile(e.target.files);
    }
  };

  const uploadFile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || file.length === 0) return;

    const formData = new FormData();

    Array.from(file).forEach((file) => {
      formData.append("files", file);
    });

    uploadMutation.mutate(formData);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Documents
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Upload the HR policies you want to ask questions about.
        </p>
      </div>

      <form onSubmit={uploadFile}>
        {/* File picker */}
        <label
          htmlFor="file-upload"
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 transition hover:border-blue-400 hover:bg-blue-50/50"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 16V4m0 0-4 4m4-4 4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 20h14"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span className="text-sm font-medium text-slate-700">
            Choose policy documents
          </span>

          <span className="mt-1 text-xs text-slate-400">
            PDF, TXT or Markdown
          </span>

          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {/* Selected files */}
        {file && file.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Selected documents
            </p>

            {Array.from(file).map((selectedFile) => (
              <div
                key={`${selectedFile.name}-${selectedFile.size}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2v6h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <span className="truncate text-sm text-slate-700">
                  {selectedFile.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={
              !file ||
              file.length === 0 ||
              uploadMutation.isPending
            }
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {uploadMutation.isPending
              ? "Uploading..."
              : "Upload documents"}
          </button>
        </div>
      </form>

      {/* Success */}
      {uploadMutation.isSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <span className="font-medium">
            Upload complete.
          </span>

          Your documents are ready to query.
        </div>
      )}

      {/* Error */}
      {uploadMutation.isError && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          Upload failed. Please try again.
        </div>
      )}
    </section>
  );
};

export default FileUpload;

