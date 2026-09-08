export type BlockType =
  | "heading"
  | "paragraph"
  | "table"
  | "list"
  export interface Document {
  id: string;
  blocks: DocumentBlock[];
}

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | TableBlock
  | ListBlock

  export interface BaseBlock{
    type:BlockType
    headingPath:string[]
  }
export interface HeadingBlock extends BaseBlock {
  type: "heading";

  depth: number;
  text: string;
}
export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";

  text: string;
}
export interface TableBlock extends BaseBlock {
  type: "table";

  headers: string[];

  rows: string[][];

}
export interface ListBlock extends BaseBlock {
  type: "list";

  ordered: boolean;

  items: string[];
}