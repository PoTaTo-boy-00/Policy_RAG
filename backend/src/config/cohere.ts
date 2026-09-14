import { CohereClientV2 } from "cohere-ai";
import "dotenv/config"
if(process.env.COHERE_API_KEY){
    console.log("[COHERE CONFIG] env loaded" )
}
export const cohere=new CohereClientV2({
    token: process.env.COHERE_API_KEY
})