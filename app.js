const express = require("express");
const path = require("path");
const multer = require("multer");
const collection = require("./mongodb");

const app = express();
const port = 3000;

// Static files path
const staticPath = path.join(__dirname, "public");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));

// Configure Multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Handle issue report submissions
app.post("/report", upload.array("images", 5), async (req, res) => {
  try {
    const { name, mobile, aadhar, issue, area } = req.body;
    const images = req.files.map((file) => {
      return {
        filename: file.originalname,
        contentType: file.mimetype,
        data: file.buffer.toString("base64"), // Convert buffer to base64
      };
    });

    if (!name || !mobile || !aadhar || !issue || !area) {
      return res.status(400).sendFile(path.join(staticPath, "error.html"));
    }

    const data = { name, mobile, aadhar, issue, area, images };
    await collection.insertMany([data]);

    res.status(200).sendFile(path.join(staticPath, "success.html"));
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).sendFile(path.join(staticPath, "error.html"));
  }
});

// View all reported issues with images (Base64 data)
// View all reported issues with images (Styled with TailwindCSS)
app.get("/view-reports", async (req, res) => {
  try {
    const reports = await collection.find();

    // Render the reports with image data
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>View Reports</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100 min-h-screen">
          <header class="bg-gray-800 p-6 shadow-md">
            <h1 class="text-3xl font-bold text-center">Reported Issues</h1>
          </header>
          <main class="p-6 space-y-6 max-w-6xl mx-auto">
            ${reports
              .map((report) => {
                return `
                <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div class="p-6">
                    <h2 class="text-2xl font-bold mb-4">${report.issue}</h2>
                    <p><strong>Name:</strong> ${report.name}</p>
                    <p><strong>Mobile:</strong> ${report.mobile}</p>
                    <p><strong>Aadhar:</strong> ${report.aadhar}</p>
                    <p><strong>Area:</strong> ${report.area}</p>
                  </div>
                  ${
                    report.images.length > 0
                      ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                          ${report.images
                            .map((image) => {
                              return `
                              <img src="data:${image.contentType};base64,${image.data}" alt="${image.filename}" class="rounded-lg shadow-md w-full object-cover h-48" />
                              `;
                            })
                            .join("")}
                        </div>`
                      : ""
                  }
                </div>
                `;
              })
              .join("")}
          </main>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).send("Error fetching reports.");
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
