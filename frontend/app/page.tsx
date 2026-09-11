
"use client";

import FileUpload from "./components/FileUpload";
import QueryInput from "./components/QueryInput";
import Answer from "./components/Answer";
import DocumentList from "./components/DocumentList";

const Page = () => {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            HR Policy Assistant
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Upload your HR policies and ask questions about them.
          </p>
        </header>

        <div className="space-y-6">
          <FileUpload />
          <DocumentList/>
          <QueryInput />
          <Answer />
        </div>
      </div>
    </main>
  );
};

export default Page;

