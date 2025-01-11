const mongoose = require("mongoose");

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/LoginandSignup")
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("Failed to connect to MongoDB", error);
  });

// Define the schema for login/signup
const LogInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Define the model
const collection = mongoose.model("Collection1", LogInSchema);

// Export the model for use in other files
module.exports = collection;
