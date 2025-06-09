import dotenv from "dotenv";
import app from "./app.js";
import mongoose from "mongoose";

// Load the .env file from the Server directory
dotenv.config();

const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_CONNECTION_STR;

// Check if the connection string is defined
if (!MONGODB_URI) {
  console.error(
    "MongoDB connection string is not defined. Please check your .env file."
  );
  process.exit(1);
}

// // Connect to MongoDB
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("connected"))
//   .catch((err) => console.log(err));

// // Start the server
// app.listen(port, () => console.log("Server running on Port " + port));

mongoose
  .connect(
    MONGODB_URI
    //   {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // }
  )
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => {
      console.log(`Server running on Port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
