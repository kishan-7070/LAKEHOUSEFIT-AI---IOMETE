import mongoose from "mongoose";
import dns from "node:dns";

// Ensure MongoDB Atlas SRV records can be resolved on Windows environments
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

interface ConnectionStatus {
  isConnected: boolean;
  mode: "mongodb" | "in_memory";
  message: string;
}

let isConnecting = false;

export async function connectToDatabase(): Promise<ConnectionStatus> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === "") {
    return {
      isConnected: false,
      mode: "in_memory",
      message: "No MONGODB_URI configured. Running in Demo Mode with in-memory storage.",
    };
  }

  if (mongoose.connection.readyState === 1) {
    return {
      isConnected: true,
      mode: "mongodb",
      message: "Connected to MongoDB.",
    };
  }

  if (isConnecting) {
    return {
      isConnected: false,
      mode: "in_memory",
      message: "Connecting to MongoDB...",
    };
  }

  try {
    isConnecting = true;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnecting = false;
    return {
      isConnected: true,
      mode: "mongodb",
      message: "Connected to MongoDB successfully.",
    };
  } catch (error) {
    isConnecting = false;
    console.warn("MongoDB connection failed; falling back to in-memory demo store:", (error as Error).message);
    return {
      isConnected: false,
      mode: "in_memory",
      message: `Database connection error (${(error as Error).message}). Using in-memory fallback.`,
    };
  }
}

export function getDatabaseMode(): "mongodb" | "in_memory" {
  return mongoose.connection.readyState === 1 ? "mongodb" : "in_memory";
}
