require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();

const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const OBJECT_TYPE_ID = process.env.OBJECT_TYPE_ID;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// HOME PAGE — GET LIST OF CUSTOM OBJECT RECORDS

app.get("/", async (req, res) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}?limit=100&properties=pet_name&properties=pet_type&properties=age`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        "Content-Type": "application/json",
      },
    });

    res.render("homepage", {
      pets: response.data.results || [],
    });
  } catch (err) {
    console.log("GET Error:", err.response?.data || err);
    res.render("homepage", { pets: [] });
  }
});

// UPDATE PAGE (ADD + EDIT)

app.get("/update-cobj", async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.render("updates", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      data: null,
      id: null,
    });
  }

  try {
    const record = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}/${id}?properties=pet_name&properties=pet_type&properties=age`,
      {
        headers: {
          Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.render("updates", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      data: record.data.properties,
      id,
    });
  } catch (err) {
    console.log("Edit GET Error:", err.response?.data || err);
    res.send("Error loading record for editing");
  }
});

// CREATE OR UPDATE RECORD (POST /update-cobj)
app.post("/update-cobj", async (req, res) => {
  try {
    const { id, pet_name, pet_type, age } = req.body;

    const payload = {
      properties: { pet_name, pet_type, age },
    };

    if (id) {
      // ---------------- UPDATE EXISTING RECORD ----------------
      await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // ---------------- CREATE NEW RECORD ----------------
      await axios.post(
        `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE_ID}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    res.redirect("/");
  } catch (err) {
    console.log("Create/Update Error:", err.response?.data || err);
    res.status(400).send("Error saving record");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
