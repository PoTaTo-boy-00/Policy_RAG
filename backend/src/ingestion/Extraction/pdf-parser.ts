
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
// import { readFile } from './readFile';]
export const pdfParser=async(path:string)=>{
    const buffer=await fs.readFile(path)
    const parser=new PDFParse({
        data:buffer
    })
    const res=await parser.getText()
    return res.text
}