import fs from "fs/promises";
import { pdfParser } from "./pdf-parser.js";
import { parseMd } from "./md-parser.js";
import type { DocumentBlock } from "../../types/documentType.js";
import { readFileSync, writeFileSync } from "fs";
import { processPdfWithOcr } from "@firecrawl/pdf-inspector";
// import read

export const readFile = async (path: string, mimetype: string) => {
  let data;
  //     console.log(mimetype)
  if (mimetype === "pdf") {
    // convert to md
    const pdf = readFileSync(path);
    const ocr = await processPdfWithOcr(pdf);
    const markdown = ocr.markdown;

    const mdPath = path.replace(/\.pdf$/i, ".md");
    writeFileSync(mdPath, markdown, "utf-8");

    console.log("PDF converted to Markdown");
    data = await parseMd(mdPath);
    // return
  } else {
    data = await parseMd(path);
  }

  return data;
};
