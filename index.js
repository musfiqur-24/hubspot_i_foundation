require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects";
const ACCESS_TOKEN = process.env.PRIVATE_APP_ACCESS;
const OBJECT_TYPE_ID = process.env.OBJECT_TYPE_ID;
const PET_PROPERTIES = process.env.PET_PROPERTIES.split(",");


// GET Pets + Pagination

app.get("/", async (req, res) => {
    const after = req.query.after || null;

    try {
        const response = await axios.get(
            `${HUBSPOT_API}/${OBJECT_TYPE_ID}`,
            {
                headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
                params: {
                    properties: PET_PROPERTIES.join(","),
                    limit: 10,
                    after: after ? after : undefined
                }
            }
        );

        const pets = response.data.results;
        const nextPage = response.data.paging?.next?.after || null;

        res.render("pets", {
            pets,
            nextPage,
            after
        });

    } catch (err) {
        console.error(err.response?.data || err);
        res.send("Error fetching pets");
    }
});

// CREATE Pet

app.post("/create", async (req, res) => {
    const { pet_name, pet_type, age } = req.body;

    try {
        await axios.post(
            `${HUBSPOT_API}/${OBJECT_TYPE_ID}`,
            {
                properties: { pet_name, pet_type, age }
            },
            {
                headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
            }
        );

        res.redirect("/");
    } catch (err) {
        console.error(err.response?.data || err);
        res.send("Error creating pet");
    }
});

// UPDATE Pet

app.post("/update", async (req, res) => {
    const { id, pet_name, pet_type, age } = req.body;

    try {
        await axios.patch(
            `${HUBSPOT_API}/${OBJECT_TYPE_ID}/${id}`,
            { properties: { pet_name, pet_type, age } },
            {
                headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
            }
        );

        res.redirect("/");
    } catch (err) {
        console.error(err.response?.data || err);
        res.send("Error updating pet");
    }
});
// DELETE Pet
app.get("/delete/:id", async (req, res) => {
    try {
        await axios.delete(
            `${HUBSPOT_API}/${OBJECT_TYPE_ID}/${req.params.id}`,
            {
                headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
            }
        );
        res.redirect("/");
    } catch (err) {
        console.error(err.response?.data || err);
        res.send("Error deleting pet");
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
