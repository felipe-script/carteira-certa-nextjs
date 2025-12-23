// app/actions.ts
"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is not defined.");
    }
    const sql = neon(databaseUrl);
    const data = await sql`SELECT NOW() as current_time`;
    return data;
}