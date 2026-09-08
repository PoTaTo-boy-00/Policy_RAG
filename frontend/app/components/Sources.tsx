
"use client";

import { useState } from "react";
import type { Source } from "./QueryInput";

type CitationProps = {
  source: Source;
//   sourceNumber: number;
};

const Citation = ({
  source,
//   sourceNumber,
}: CitationProps) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-blue-50 px-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
        // aria-label={`View source ${sourceNumber}`}
      >
        {source.sourceId}
      </button>

      {open && (
        <div className="absolute left-1/2 top-7 z-50 w-96 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {source.documentName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Chunk {source.chunkIndex}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close citation"
            >
              ×
            </button>
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-slate-100" />

          {/* Snippet */}
          <p className="text-sm leading-6 text-slate-600">
            {source.snippet}
          </p>

          {/* Source number */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-5 w-3xl items-center justify-center rounded bg-slate-100 font-medium text-slate-500">
              {source.sourceId}
            </span>

           
          </div>
        </div>
      )}
    </span>
  );
};

export default Citation;

