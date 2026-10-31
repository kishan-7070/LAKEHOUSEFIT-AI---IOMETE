import dns from "dns";
import mongoose from "mongoose";

// Disable Mongoose query buffering globally so operations fail fast instead of hanging 10s if disconnected
mongoose.set("bufferCommands", false);

// Ensure SRV records for mongodb+srv:// can be resolved across all ISPs (e.g., Windows / Jio / Airtel)
if (typeof dns.setServers === "function") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (dnsErr) {
    console.warn("Could not set custom DNS servers:", (dnsErr as Error).message);
  }
}

interface ConnectionStatus {
  isConnected: boolean;
  mode: "mongodb" | "in_memory";
  message: string;
}

let isConnecting = false;
let lastFailureTime = 0;
const FAILURE_COOLDOWN_MS = 15000; // Cache connection failure for 15s to prevent stalling requests

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

  // Fast-fail if recent connection failed within cooldown window (prevents request stalling)
  const now = Date.now();
  if (now - lastFailureTime < FAILURE_COOLDOWN_MS) {
    return {
      isConnected: false,
      mode: "in_memory",
      message: "MongoDB connection cooling down after recent failure. Serving from in-memory store.",
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
      serverSelectionTimeoutMS: 5000,
    });
    isConnecting = false;
    lastFailureTime = 0;
    return {
      isConnected: true,
      mode: "mongodb",
      message: "Connected to MongoDB successfully.",
    };
  } catch (error) {
    isConnecting = false;
    lastFailureTime = Date.now();
    console.warn("MongoDB connection failed; falling back to in-memory store:", (error as Error).message);
    return {
      isConnected: false,
      mode: "in_memory",
      message: `Database connection error: ${(error as Error).message}. Using in-memory fallback.`,
    };
  }
}

export function getDatabaseMode(): "mongodb" | "in_memory" {
  return mongoose.connection.readyState === 1 ? "mongodb" : "in_memory";
}
