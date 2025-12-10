// Load environment variables
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.set("view engine", "pug");
app.set("views", "./views");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// HubSpot config
const TOKEN = process.env.PRIVATE_APP_ACCESS;
const OBJECT_TYPE_ID = process.env.OBJECT_TYPE_ID;

// ---------------------------------------
// 1️⃣ Homepage – List all custom objects
// ---------------------------------------
app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}?properties=pet_name&properties=pet_type&properties=age`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const records = response.data.results || [];

    res.render("pets", {
      title: "Custom Object Table",
      records: records,
    });
  } catch (error) {
    console.error("Error fetching records:", error.response?.data || error);
    res.send("Error fetching records.");
  }
});

// ---------------------------------------
// 2️⃣ Form Page – Show the form
// ---------------------------------------
app.get("/update-cobj", (req, res) => {
  res.render("update", {
    title: "Update Custom Object Form",
  });
});

// ---------------------------------------
// 3️⃣ Handle Form Submission – Create record
// ---------------------------------------
app.post("/update-cobj", async (req, res) => {
  const { pet_name, pet_type, age } = req.body;

  try {
    await axios.post(
      `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}`,
      {
        properties: {
          pet_name,
          pet_type,
          age,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error creating record:", error.response?.data || error);
    res.send("Error creating record.");
  }
});

// ---------------------------------------
// 4️⃣ Start server
// ---------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
