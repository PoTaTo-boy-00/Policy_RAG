import { Redis } from "ioredis";
import "dotenv/config"
export const connection=new Redis(
    process.env.REDIS_URL||"redis://localhost:6379",
    {
        maxRetriesPerRequest:null
    }
)