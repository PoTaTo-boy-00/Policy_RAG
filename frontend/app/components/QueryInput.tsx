"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import { streamAns } from "./Answer";
import { DocResponse, DocType } from "./FileUpload";
import { useUploadedFiles } from "../hooks/useUploadedFIles";
import axios from "axios";

export interface QueryResponse {
  queryId: string;
  sources: Source[];
  answer: string;
}

export interface QueryPayload {
  query: string;
  filePaths: string[];
}

export interface Source {
  sourceId: string;
  chunkId: string;
  documentName: string;
  documentId: string;
  chunkIndex: number;
  snippet: string;
}

const postQuery = async ({
  query,
  filePaths,
}: QueryPayload): Promise<QueryResponse> => {
  const res = await api.post<QueryResponse>("/query", {
    question: query,
    pathIds: filePaths,
  });

  return res.data;
};

const QueryInput = () => {
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");

  // const { data: filePaths = [] } = useQuery({
  //   queryKey: ["uploaded-files"],
  //   queryFn: () => Promise.resolve([] as string[]),
  // });
  const { data: paths = [] } = useUploadedFiles();
  const filePaths = paths.filter((d) => d.allowed).map((d) => d.id);
  console.log("FilePaths", filePaths);
  const queryMutation = useMutation({
    mutationFn: postQuery,

    onSuccess: async (data) => {
      const { sources, queryId } = data;

      queryClient.setQueryData<QueryResponse>(["query-response"], {
        sources,
        queryId,
        answer: "",
      });

      await streamAns(queryId, queryClient);
    },

    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        alert("Query Too Large")
        return;
      }

      console.error("Something went wrong:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    if (filePaths.length === 0) {
      alert("Upload a document first.");
      return;
    }

    queryMutation.mutate({
      query: query.trim(),
      filePaths,
    });
  };

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Ask a question</h2>

        <p className="mt-1 text-sm text-slate-500">
          Ask anything about your uploaded HR policies.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How many days of annual leave do employees get?"
            disabled={queryMutation.isPending}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!query.trim() || queryMutation.isPending}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {queryMutation.isPending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="opacity-25"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Asking...
              </>
            ) : (
              <>
                Ask
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {queryMutation.isError && (
        <p className="mt-2 text-sm text-red-600">
          Something went wrong while processing your question.
        </p>
      )}
    </section>
  );
};

export default QueryInput;
