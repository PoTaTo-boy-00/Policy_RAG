
"use client";

import { QueryClient, useQuery } from "@tanstack/react-query";
import React from "react";

import { QueryResponse, Source } from "./QueryInput";
import Citation from "./Sources";

export const renderAnswer = (
  answer: string,
  sources: Source[]
) => {
  const parts = answer.split(/(\[Source \d+\])/g);

  return parts.map((part, index) => {
    const match = part.match(/\[Source (\d+)\]/);

    if (!match) {
      return <span key={index}>{part}</span>;
    }

    const sourceNumber = Number(match[1]);
    const source = sources[sourceNumber - 1];

    if (!source) {
      return <span key={index}>{part}</span>;
    }

    return (
      <Citation
        key={index}
        source={source}
        // sourceNumber={sourceNumber}
      />
    );
  });
};

export const streamAns = async (
  queryId: string,
  queryClient: QueryClient
) => {
  const res = await fetch(
    `http://localhost:8080/query/stream?queryId=${queryId}`
  );

  if (!res.ok) {
    throw new Error("Failed to connect to stream");
  }

  if (!res.body) {
    throw new Error("ReadableStream not available");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");

    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.startsWith("data:")) continue;

      const data = event.replace(/^data:\s*/, "");

      try {
        const parsedData = JSON.parse(data);

        if (parsedData.type === "chunk") {
          queryClient.setQueryData<QueryResponse>(
            ["query-response"],
            (old) => {
              if (!old) return old;

              return {
                ...old,
                answer: old.answer + parsedData.content,
              };
            }
          );
        }

        if (parsedData.type === "done") {
          console.log("Generation completed");
        }

        if (parsedData.type === "error") {
          console.error(parsedData.message);
        }
      } catch (error) {
        console.error("Invalid SSE data:", data);
      }
    }
  }
};

const Answer = () => {
  const { data: queryRes } = useQuery<QueryResponse | null>({
    queryKey: ["query-response"],
    queryFn: () => Promise.resolve(null),
    initialData: null,
  });

  if (!queryRes) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">

        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Your answer will appear here
        </h2>

        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Upload your HR documents and ask a question to get a
          source-backed answer.
        </p>
      </section>
    );
  }

  const { sources, answer } = queryRes;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Answer
        </h2>
      </div>

      <div className="px-6 py-6">
        {answer ? (
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
            {renderAnswer(answer, sources)}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-slate-500">
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

            Generating answer...
          </div>
        )}
      </div>
    </section>
  );
};

export default Answer;

