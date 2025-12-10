const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const HUBSPOT_API_URL = "https://api.hubapi.com/crm/v3/objects";
const TOKEN = process.env.PRIVATE_APP_ACCESS;
const OBJECT_TYPE_ID = process.env.OBJECT_TYPE_ID;

// -----------------------------
// Fetch pets with pagination
// -----------------------------
async function fetchPets(limit = 10, after = undefined) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_URL}/${OBJECT_TYPE_ID}/search`,
      {
        limit: limit,
        after: after,
        properties: process.env.PET_PROPERTIES.split(","),
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      results: response.data.results || [],
      next: response.data.paging?.next?.after || null,
    };
  } catch (error) {
    console.error("Error fetching pets:", error.response?.data || error);
    return { results: [], next: null };
  }
}

// -----------------------------
// CREATE PET
// -----------------------------
app.post("/create", async (req, res) => {
  const { pet_name, pet_type, age } = req.body;

  try {
    await axios.post(
      `${HUBSPOT_API_URL}/${OBJECT_TYPE_ID}`,
      { properties: { pet_name, pet_type, age } },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.redirect("/");
  } catch (error) {
    res.send("Error creating pet: " + JSON.stringify(error.response?.data));
  }
});

// -----------------------------
// UPDATE PET
// -----------------------------
app.post("/update", async (req, res) => {
  const { id, pet_name, pet_type, age } = req.body;

  try {
    await axios.patch(
      `${HUBSPOT_API_URL}/${OBJECT_TYPE_ID}/${id}`,
      { properties: { pet_name, pet_type, age } },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.redirect("/");
  } catch (error) {
    res.send("Error updating pet: " + JSON.stringify(error.response?.data));
  }
});

// -----------------------------
// DELETE PET
// -----------------------------
app.get("/delete/:id", async (req, res) => {
  try {
    await axios.delete(
      `${HUBSPOT_API_URL}/${OBJECT_TYPE_ID}/${req.params.id}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    res.redirect("/");
  } catch (error) {
    res.send("Error deleting pet: " + JSON.stringify(error.response?.data));
  }
});

// -----------------------------
// HOME PAGE WITH PAGINATION
// -----------------------------
app.get("/", async (req, res) => {
  const limit = 10;
  const after = req.query.after || undefined;

  const data = await fetchPets(limit, after);

  let rows = "";
  data.results.forEach((p) => {
    rows += `
      <tr>
        <td>${p.properties.pet_name}</td>
        <td>${p.properties.pet_type}</td>
        <td>${p.properties.age}</td>
        <td>
          <button onclick="fillUpdateForm('${p.id}', '${p.properties.pet_name}', '${p.properties.pet_type}', '${p.properties.age}')">Edit</button>
        </td>
        <td><a href="/delete/${p.id}" onclick="return confirm('Delete this pet?')">Delete</a></td>
      </tr>
    `;
  });

  const nextPage = data.next ? `/?after=${data.next}` : null;

  res.send(`
    <html>
    <head>
      <title>Pet Manager</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 10px; }
        th { background: #f0f0f0; }
        .form-row { display: flex; gap: 20px; }
        .form-box { flex: 1; border: 1px solid #ccc; padding: 20px; }
        input { padding: 8px; margin: 5px 0; width: 100%; }
        button { padding: 10px; cursor: pointer; }
        .pagination { margin-top: 20px; }
        .pagination a { padding: 8px 12px; border: 1px solid #ccc; margin-right: 10px; text-decoration: none; }
      </style>

      <script>
        function fillUpdateForm(id, name, type, age) {
          document.getElementById("update-id").value = id;
          document.getElementById("update-name").value = name;
          document.getElementById("update-type").value = type;
          document.getElementById("update-age").value = age;
        }
      </script>
    </head>
    <body>

      <h1>Pet Manager</h1>

      <div class="form-row">
        <!-- CREATE FORM -->
        <div class="form-box">
          <h2>Create Pet</h2>
          <form action="/create" method="POST">
            <input type="text" name="pet_name" placeholder="Pet Name" required />
            <input type="text" name="pet_type" placeholder="Pet Type" required />
            <input type="number" name="age" placeholder="Age" required />
            <button type="submit">Create</button>
          </form>
        </div>

        <!-- UPDATE FORM -->
        <div class="form-box">
          <h2>Update Pet</h2>
          <form action="/update" method="POST">
            <input type="hidden" id="update-id" name="id" />
            <input type="text" id="update-name" name="pet_name" placeholder="New Name" required />
            <input type="text" id="update-type" name="pet_type" placeholder="New Type" required />
            <input type="number" id="update-age" name="age" placeholder="New Age" required />
            <button type="submit">Update</button>
          </form>
        </div>
      </div>

      <h2>Pet List</h2>
      <table>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Age</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
        ${rows}
      </table>

      <div class="pagination">
        ${after ? `<a href="/">⬅️ Previous</a>` : ""}
        ${nextPage ? `<a href="${nextPage}">Next ➡️</a>` : ""}
      </div>

    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
