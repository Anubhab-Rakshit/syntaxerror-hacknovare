const express = require("express");
const path = require("path");
const multer = require("multer");
const collection = require("./mongodb");
const session = require("express-session");

const app = express();
const port = 3000;
const Authority = require("./models/authority");
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
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100">
          <div class="container mx-auto px-4 py-10">
            <h1 class="text-4xl font-extrabold text-center mb-8 text-gray-100 hover:text-gray-300">Graphical Analysis</h1>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Reports Chart -->
              <div class="p-6 bg-gray-800 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
                <canvas id="reportsChart" class="w-full h-80"></canvas>
              </div>

              <!-- Issues Chart -->
              <div class="p-6 bg-gray-800 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
                <canvas id="issuesChart" class="w-full h-80"></canvas>
              </div>
            </div>

            <a href="/view-reports" class="block mt-8 mx-auto text-center text-lg font-semibold bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-all">
              Back to Reported Issues
            </a>
          </div>

          <script>
            // Data for Monthly Reports Filed
            const labels = ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];
            const reportsData = {
              labels: labels,
              datasets: [{
                label: 'Reports Filed',
                data: ${JSON.stringify(monthlyReports)},
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 206, 86, 0.7)',
                  'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(201, 203, 207, 0.7)',
                  'rgba(99, 255, 132, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 159, 64, 0.7)',
                  'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
                  'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(201, 203, 207, 1)',
                  'rgba(99, 255, 132, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 159, 64, 1)',
                  'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'
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


const ensureLoggedIn = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.redirect("/authorities-modify/login");
  }
};

// Routes

// Public: View all authorities
app.get("/authorities", async (req, res) => {
  try {
    const authorities = await Authority.find();
    res.status(200).json(authorities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching authorities." });
  }
});

// Government login page
app.get("/authorities-modify/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html")); // Login page
});

// Handle government login
app.post("/authorities-modify/login", (req, res) => {
  const { id, password } = req.body;
  console.log("Received data:", req.body);

  // Hardcoded credentials
  const governmentId = "1234";
  const governmentPassword = "qwerty";

  if (id === governmentId && password === governmentPassword) {
    req.session.isLoggedIn = true;
    res.redirect("/authorities-modify");
  } else {
    res.sendFile(path.join(__dirname, "views", "login.html")); // Reload login page on failure
  }
});

// Modify authorities (protected)
app.get("/authorities-modify", ensureLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "modify.html")); // Modify authorities page
});

// Add new authority (protected)
app.post("/authorities-modify/add", ensureLoggedIn, async (req, res) => {
  const { name, email, honourScore } = req.body;

  try {
    const newAuthority = new Authority({ name, email, honourScore });
    await newAuthority.save();
    res.redirect("/authorities-modify");
  } catch (error) {
    res.status(500).send("Error adding authority.");
  }
});

// Update honour score (protected)
app.post("/authorities-modify/update", ensureLoggedIn, async (req, res) => {
  const { id, honourScore } = req.body;

  try {
    const authority = await Authority.findByIdAndUpdate(
      id,
      { honourScore },
      { new: true }
    );

    if (!authority) {
      return res.status(404).send("Authority not found.");
    }

    res.redirect("/authorities-modify");
  } catch (error) {
    res.status(500).send("Error updating honour score.");
  }
});

// Logout for government
app.get("/authorities-modify/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/authorities-modify/login");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
