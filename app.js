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

    // Render the reports with centered images and animations
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>View Reports</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100">
          <div class="container mx-auto py-10">
            <h1 class="text-4xl font-bold text-center mb-10">Reported Issues</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${reports
                .map((report) => {
                  return `
                  <div 
                    class="p-6 bg-gray-800 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer"
                  >
                    <p class="font-semibold text-lg mb-2">${report.name}</p>
                    <p class="text-sm text-gray-400 mb-2"><strong>Mobile:</strong> ${report.mobile}</p>
                    <p class="text-sm text-gray-400 mb-2"><strong>Aadhar:</strong> ${report.aadhar}</p>
                    <p class="text-sm text-gray-400 mb-2"><strong>Issue:</strong> ${report.issue}</p>
                    <p class="text-sm text-gray-400 mb-4"><strong>Area:</strong> ${report.area}</p>
                    <div class="space-y-4">
                      ${report.images
                        .map((image) => {
                          return `
                          <div class="relative flex justify-center items-center overflow-hidden rounded-lg">
                            <img 
                              src="data:${image.contentType};base64,${image.data}" 
                              alt="${image.filename}" 
                              class="w-full max-h-40 object-cover transition-transform duration-300 transform hover:scale-110"
                            />
                          </div>
                          `;
                        })
                        .join("")}
                    </div>
                  </div>
                  `;
                })
                .join("")}
            </div>
          </div>
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
