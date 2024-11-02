import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL!;

interface MongooseConn {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Module-scoped cache for the MongoDB connection
let cached: MongooseConn | undefined;

if (!cached) {
  cached = { conn: null, promise: null };
}

export const connect = async () => {
  if (cached?.conn) return cached.conn;

  if (!cached?.promise) {
    cached!.promise = mongoose.connect(MONGODB_URL, {
      dbName: "clerkauth",
      bufferCommands: false,
      connectTimeoutMS: 30000,
    });
  }

  cached!.conn = await cached!.promise;

  return cached!.conn;
};
