import multipart from "@fastify/multipart";
import { pipeline } from "node:stream/promises";
import fs from "fs";
import { prisma } from "../../prisma/client.js";
export const saveFile=async(file:multipart.MultipartFile)=>{
    if (!file) {
    return{
      message: "No file uploaded",
    };
  }
//   console.log(file)
  const fileId=crypto.randomUUID()
  const extension=file.mimetype==="application/pdf"?"pdf":(file.mimetype==="text/markdown")?"md":"txt"
//   console.log(file.fieldname);
//   console.log(file.mimetype);
  //? SAVE THE FILE TO A PATH
  const path = `./uploads/${fileId}.${extension}`;
 
  await pipeline(file.file, fs.createWriteStream(path));
  return {path,fileId,extension}
}