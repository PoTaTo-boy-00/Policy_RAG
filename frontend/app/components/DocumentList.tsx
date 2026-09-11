
"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import {  useUploadedFiles } from "../hooks/useUploadedFIles";

const deleteDocument = async (id: string) => {
  const res = await api.delete(`/records/${id}`);

  if (!res.data.success) {
    throw new Error("Failed to delete document");
  }

  return res.data;
};

const updateDocumentStatus = async ({
  id,
  allowed,
}: {
  id: string;
  allowed: boolean;
}) => {
  const res = await api.put(`/records/${id}`, {
    allowed,
  });

  if (!res.data.success) {
    throw new Error("Failed to update document status");
  }

  return res.data;
};

const DocumentList = () => {
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    isFetching,
  } = useUploadedFiles();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["uploaded-files"],
      });
    },

    onError: (error) => {
      console.error("Delete failed:", error);
    },
  });
// const {data:allDocuments=[]}=useAllUploadedFiles()
  // Status mutation
  const statusMutation = useMutation({
    mutationFn: updateDocumentStatus,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["uploaded-files"],
      });
    },

    onError: (error) => {
      console.error("Status update failed:", error);
    },
  });

  const handleDelete = (id: string, name: string) => {
    // const confirmed = window.confirm(
    //   `Are you sure you want to delete "${name}"?`
    // );

    // if (!confirmed) return;

    deleteMutation.mutate(id);
  };

  const handleStatusChange = (
    id: string,
    value: string
  ) => {
    statusMutation.mutate({
      id,
      allowed: value === "allowed",
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          Loading documents...
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Uploaded Documents
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your HR policy documents.
          </p>
        </div>

        {isFetching && (
          <span className="text-xs text-slate-400">
            Refreshing...
          </span>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-slate-500">
            No documents uploaded yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 font-medium text-slate-600">
                  Document
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Status
                </th>

                <th className="px-5 py-3 text-right font-medium text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const isDeleting =
                  deleteMutation.isPending &&
                  deleteMutation.variables === doc.id;

                const isUpdatingStatus =
                  statusMutation.isPending &&
                  statusMutation.variables?.id === doc.id;

                return (
                  <tr
                    key={doc.id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* Document */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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

                        <div className="min-w-0">
                          <p className="max-w-md truncate font-medium text-slate-800">
                            {doc.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-5 py-4">
                      <select
                        value={doc.allowed ? "allowed" : "notallowed"}
                        disabled={isUpdatingStatus}
                        onChange={(e) =>
                          handleStatusChange(
                            doc.id,
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="allowed">
                          Allowed
                        </option>

                        <option value="notallowed">
                          Not allowed
                        </option>
                      </select>

                      {isUpdatingStatus && (
                        <span className="ml-2 text-xs text-slate-400">
                          Updating...
                        </span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(doc.id, doc.name)
                        }
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
