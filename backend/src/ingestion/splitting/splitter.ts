import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { fileDetails } from "../../app.js";
import type { TableBlock } from "../../types/documentType.js";
import  { Document } from "@langchain/core/documents";
const formatTable=(table:TableBlock)=>{
  const header=table.headers.join(" | ")
  const rows=table.rows.map(row=>row.join('|')).join('\n')
   return `${table.headingPath.join("\n")}

${header}
${rows}`;
}
export const textSplitter = async (fileData: fileDetails) : Promise<Document[]>=> {
  if (!fileData.data) {
    return [];
  }
  const format = fileData.format?.toLowerCase().replace(".", "") ?? "";
  let separators = ["\n\n", "\n", " ", ""];
  if (format === "md") {
    separators = ["\n# ", "\n## ", "\n### ", "\n\n", "\n", " ", ""];
  } else if (format === "pdf") {
    separators = ["\n\n", ". ", "\n", " ", ""];
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
    separators,
  });
  // if (fileData.data === undefined) {
  //   return "";
  // }
  // const chunks = await splitter.createDocuments(
  //   [fileData.data],
  //   [
  //     {
  //       fileName: fileData.name,
  //       fileId: fileData.id,
  //     },
  //   ],
  // );

  // return chunks;
  const chunks:Document[] = [];

  for (const data of fileData.data) {
    if (data.type === "paragraph") {
      const docs = await splitter.createDocuments([data.text]);
      for (const doc of docs) {
        chunks.push(
         new Document ({
          pageContent: `${data.headingPath.join("\n")} \n\n ${doc.pageContent}`,
          metadata: {
            headingPath: data.headingPath,
            contentType: "text",
            fileName: fileData.name,
            fileId: fileData.id,
          },
        }));
      }
      continue;
    }
    if(data.type==='table'){
      chunks.push(new Document({
        pageContent:formatTable(data),
        metadata:{
           headingPath: data.headingPath,
            contentType: "table",
            fileName: fileData.name,
            fileId: fileData.id,
        }
      }))
      continue;
    }
  }
  // console.log(chunks)
  return chunks;
};
