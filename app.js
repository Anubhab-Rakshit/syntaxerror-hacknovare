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

    // Render the reports with centered images and modal functionality
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
                              class="w-full max-h-40 object-cover transition-transform duration-300 transform hover:scale-110 cursor-pointer"
                              onclick="showModal('${image.contentType}', '${image.data}', '${image.filename}')"
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

          <!-- Modal -->
          <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden">
            <div class="relative bg-gray-800 rounded-lg shadow-lg p-4 max-w-3xl w-full">
              <button 
                onclick="closeModal()" 
                class="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none"
              >
                ✕
              </button>
              <img id="modalImage" src="" alt="" class="w-full rounded-lg" />
              <p id="modalImageName" class="text-gray-400 mt-4 text-center"></p>
            </div>
          </div>

          <script>
            // Show modal with the clicked image
            function showModal(contentType, data, filename) {
              const modal = document.getElementById("imageModal");
              const modalImage = document.getElementById("modalImage");
              const modalImageName = document.getElementById("modalImageName");

              modalImage.src = \`data:\${contentType};base64,\${data}\`;
              modalImageName.textContent = filename;
              modal.classList.remove("hidden");
            }

            // Close the modal
            function closeModal() {
              const modal = document.getElementById("imageModal");
              modal.classList.add("hidden");
            }
          </script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).send("Error fetching reports.");
  }
});

app.get("/graphical-analysis", async (req, res) => {
  try {
    const reports = await collection.find();

    // Initialize arrays for monthly reports, solved, and pending issues
    const monthlyReports = new Array(12).fill(0); // Zero for each month
    const solvedIssues = new Array(12).fill(0);
    const pendingIssues = new Array(12).fill(0);

    // Populate monthly data based on reports
    reports.forEach((report) => {
      const month = new Date(report._id.getTimestamp()).getMonth(); // Get month index (0 = January, 11 = December)
      monthlyReports[month]++;

      // Assuming all reports are "pending" initially
      pendingIssues[month]++;

      // Example of how to differentiate solved and pending issues
      if (report.issue.toLowerCase().includes("resolved")) {
        solvedIssues[month]++;
        pendingIssues[month]--;
      }
    });

    // HTML for the graphical analysis page
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Graphical Analysis</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #2c3e50;
              color: #ecf0f1;
              margin: 0;
              padding: 20px;
            }
            h1 {
              text-align: center;
            }
            .chart-container {
              display: flex;
              justify-content: center;
              gap: 50px;
              margin-top: 40px;
            }
            .chart {
              width: 400px;
              height: 300px;
            }
            .btn {
              display: block;
              margin: 20px auto;
              background-color: #007bff;
              color: #fff;
              padding: 10px 20px;
              text-align: center;
              border-radius: 4px;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <h1>Graphical Analysis</h1>
          <div class="chart-container">
            <div class="chart">
              <canvas id="reportsChart"></canvas>
            </div>
            <div class="chart">
              <canvas id="issuesChart"></canvas>
            </div>
          </div>
          
          <a href="/view-reports" class="btn">Back to Reported Issues</a>

          <script>
            // Data for Monthly Reports Filed
            const labels = ['December', 'January', 'February', 'March', 'April', 'May', 'June','July','August','September','October','November'];
            const reportsData = {
              labels: labels,
              datasets: [{
                label: 'Reports Filed',
                data: ${JSON.stringify(monthlyReports)},
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 206, 86, 0.7)',
                  'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(201, 203, 207, 0.7)',
                  'rgba(99, 255, 132, 0.7)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
                  'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(201, 203, 207, 1)',
                  'rgba(99, 255, 132, 1)'
                ],
                borderWidth: 1
              }]
            };

            const reportsConfig = {
              type: 'bar',
              data: reportsData,
              options: {
                responsive: true,
                plugins: {
                  legend: { position: 'top', labels: { color: '#ffffff' } },
                  title: { display: true, text: 'Monthly Reports Filed', color: '#ffffff' }
                },
                scales: {
                  x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                  y: { beginAtZero: true, max: 10, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
              }
            };

            const reportsChart = new Chart(document.getElementById('reportsChart'), reportsConfig);

            // Data for Solved vs Pending Issues
            const issuesData = {
              labels: labels,
              datasets: [
                {
                  label: 'Issues Solved',
                  data: ${JSON.stringify(solvedIssues)},
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Issues Pending',
                  data: ${JSON.stringify(pendingIssues)},
                  backgroundColor: 'rgba(255, 99, 132, 0.7)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            };

            const issuesConfig = {
              type: 'bar',
              data: issuesData,
              options: {
                responsive: true,
                plugins: {
                  legend: { position: 'top', labels: { color: '#ffffff' } },
                  title: { display: true, text: 'Monthly Issue Resolution (Solved vs Pending)', color: '#ffffff' }
                },
                scales: {
                  x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                  y: { beginAtZero: true, max: 10, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
              }
            };

            const issuesChart = new Chart(document.getElementById('issuesChart'), issuesConfig);
          </script>
        </body>
      </html>
    `;

    // Send the rendered HTML as a response
    res.send(html);
  } catch (error) {
    res.status(500).send("Error generating graphical analysis.");
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
