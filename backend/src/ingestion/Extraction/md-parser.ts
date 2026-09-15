import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import fs from "fs/promises";
import type { DocumentBlock } from "../../types/documentType.js";
import { getText } from "../../utils/getText.js";
import { parseTable } from "../../utils/parseTable.js";

export const parseMd = async (filePath: string) => {
  const data = await fs.readFile(filePath, "utf-8");
  const tree = unified().use(remarkParse).use(remarkGfm).parse(data);
  const parsedData = tree.children;
  const blocks: DocumentBlock[] = [];
  const headingStack: string[] = [];

  for (const node of parsedData) {
    // console.log(node)
    if (node.type === "heading") {
       
      const heading = getText(node);
      headingStack.length = node.depth - 1;
      headingStack.push(heading);
      blocks.push({
        type: "heading",
        depth: node.depth,
        text: heading,
        headingPath: [...headingStack],
      });
      continue;
    }
    if (node.type === "paragraph") {
     blocks.push({
        type:"paragraph",
        text:getText(node),
        headingPath:[...headingStack]
     })
     continue
    }
    if (node.type === "table") {
        const table=parseTable(node)
        blocks.push({
            type:"table",
            ...table,
            headingPath:[...headingStack]
        })
        continue;
    }
    if(node.type==="list"){
      const text=node.children.map(item=>getText(item)).join('\n')
      blocks.push({
        type:"paragraph",
        text,
        headingPath:[...headingStack]
      })
    }
  }
  console.log(blocks)
  return blocks
  // console.log(tree.children)
  // console.log(JSON.stringify(tree.type))
  // console.log(JSON.stringify(tree.type))
};
