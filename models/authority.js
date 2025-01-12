const mongoose = require("mongoose");

// Define the Authority schema
const authoritySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  honourScore: {
    type: Number,
    required: true,
    default: 0,
  },
});

// Create the Authority model
const Authority = mongoose.model("Authority", authoritySchema);

module.exports = Authority;
