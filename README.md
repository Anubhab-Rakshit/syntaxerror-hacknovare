# Civilized Chaos

**CIVILIZED CHAOS** is a web application designed to streamline issue reporting, authority management, and provide real-time insights with interactive graphs. This project offers a seamless way for citizens to report issues, view authorities, and access visual data analytics in a structured and responsive layout.

**For viewing the deployment**
Website link :- https://civilizedchaos.netlify.app 


## Features

- **Home Page**: The landing page introduces users to the core features of the application, including links to the "About Us" section, "Report Issue," and "Authorities" list.
- **Report Issue**: Citizens can submit reports related to various issues by providing details like name, contact information, area, and an optional image upload.
- **Authorities List**: A comprehensive list of government authorities is available for citizens to view, with details of their roles, email, and honor score.
- **Real-time Graphs**: Interactive charts display real-time data on reported issues and their status, providing a graphical representation of the issues reported over time.
  

## Tech Stack

- **Frontend**: HTML, CSS (TailwindCSS), JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (using Mongoose)
- **File Uploads**: Multer  
- **Charts**: Chart.js for graphical analysis

# How It Works

### **Home Page**
The homepage (`index.html`) provides users with easy access to the core sections:
- **About Us**
- **Report Issue**
- **Authorities List**
- **Add or Modify Authorities (Only for Government)**
- **Trending Reports**

### **Reporting an Issue**
Citizens can use the **"Report Issue"** form to submit issues, along with optional images. The information is:
- Saved in the **MongoDB** database.
- Made available for review by the relevant authorities.

### **Viewing Authorities**
The **"Authorities"** section fetches a list of authorities from the database and presents them in a clean, ordered manner. This allows users to easily see:
- The list of authorities
- Their contact information
- Honour scores for accountability

### **Graphical Analysis**
Real-time charts display:
- **Monthly reports**
- The **status of issues** (solved vs. pending)

The data for these charts is dynamically generated based on the reports submitted by users, giving administrators and citizens real-time insights into the current state of the issues.


### **Add or Modify Authorities (Only for Government)**

This section is **exclusively for government users** and allows them to:
- **Add new authorities**: Government users can add new authorities to the system, providing necessary details such as:
  - Name
  - Email
  - Honour Score
- **Modify existing authorities**: Authorities' **honour scores** can be updated for accountability and performance tracking. This ensures that any changes in an authority's score are reflected in real time.
- **Authentication**: Only authenticated government users are allowed to access this section, ensuring that only authorized personnel can manage the authorities list.

This feature ensures that the database of authorities is kept up-to-date, with proper oversight and secure access.

### **Trending Reports**

The **Trending Reports** section provides a real-time overview of the most reported issues by citizens. It offers the following features:
- **Top Reports**: Displays the reports that have gained the most attention, either by the number of users reporting the same issue or the severity of the problem.
- **Graphical Insights**: Offers visualizations of report trends, helping users and administrators identify emerging problems.


This section is valuable for understanding which problems are most critical or widespread, enabling faster response and better prioritization for authorities.




## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Anubhab-Rakshit/syntaxerror-hacknovare.git

**Overview of the page**

![image](https://github.com/user-attachments/assets/a510cf01-46b7-47bb-86af-d5f402deb243)

