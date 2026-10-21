import mongoose from 'mongoose';

let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_gig';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isMongoConnected = false;
    console.log(`[MongoDB] Notice: Could not connect to MongoDB at ${uri}. Operating in resilient high-speed in-memory store mode.`);
    return false;
  }
};

export const getMongoStatus = () => {
  return {
    connected: isMongoConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  };
};
