import type {Table} from "mdast"
import { getText } from "./getText.js";
export function parseTable(table:Table){
    const rows=table.children
    if(rows.length===0){
        return{
            headers:[],
            rows:[]
        }
    }
    const headers=rows[0]?.children.map((cell)=>getText(cell))||[]
    const dataRows=rows.slice(1).map(row=>row.children.map(cell=>getText(cell)))
    return {
        headers,
        rows:dataRows
    }
}