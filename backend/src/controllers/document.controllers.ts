import { prisma } from "../prisma/client.js";
interface DocType{
    id:string,
    name:string,
    allowed:boolean,
    isDeleted:boolean
}
export const getDocuments = async ():Promise<DocType[]> => {
  const allowedDocuments = await prisma.document.findMany({
    where: {  isDeleted: false },
    select:{id:true,name:true,isDeleted:true,allowed:true}
  });

  return allowedDocuments
}
export const getDocumentId = async ():Promise<string[]> => {
  const allowedDocuments = await prisma.document.findMany({
    where: {  isDeleted: false },
    select:{id:true,name:true,isDeleted:true,allowed:true}
  });

  return allowedDocuments.map(doc=>doc.id)
}

// export const gdeDocuments=async()=>{}
export const updateDocuments = async (id: string) => {
  const doc = await prisma.document.findUnique({
    where: { id },
  });

  if (!doc) {
    throw new Error("Document not found");
  }

  const updateDoc = await prisma.document.update({
    where: { id },
    data: {
      allowed: !doc.allowed,
    },
  });
  if (updateDoc) {
    return true;
  } else {
    return false;
  }
};
export const deleteDocument = async (id: string) => {

  const updateDoc = await prisma.document.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });
  if (updateDoc) {
    return true;
  } else {
    return false;
  }
};
