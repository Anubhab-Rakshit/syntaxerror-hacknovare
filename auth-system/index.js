const express = require("express");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");

const app = express();
const port = 3000;

// Paths for templates and public files
const templatePath = path.join(__dirname, "../templates");
const staticPath = path.join(__dirname, "../public");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));

// Setting up Handlebars and views directory
app.set("view engine", "hbs");
app.set("views", templatePath);

// Routes
// Home route
app.get("/", (req, res) => {
  res.render("login");
});

// Signup route (GET)
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Signup route (POST)
app.post("/signup", async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      password: req.body.password,
    };

    await collection.insertMany([data]);
    res.render("home");
  } catch (error) {
    res.render("signup", {
      error: "Error creating account. Please try again.",
    });
  }
});

// Login route (POST)
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.name });

    if (check && check.password === req.body.password) {
      res.render("home");
    } else {
      res.render("login", { error: "Incorrect password!" });
    }
  } catch {
    res.render("login", { error: "Incorrect details!" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
