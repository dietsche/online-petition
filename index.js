const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./utils/db");

// var canvas = document.getElementById("canvas");
// var context = canvas.getContext("2d");

// const projects = require("./projects.json");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false //allows us to read the body of the post request
    })
);

app.get("/", (req, res) => {
    res.render("petition", {
        layout: "main"
        // projects,
        // helpers: {
        //     highlightLink(projFromList, selectedProj) {
        //         if (selectedProj && projFromList == selectedProj.directory) {
        //             return "active";
        //         }
        //     }
        // }
    });
});

app.post("/", (req, res) => {
    console.log("request: ", req.body);
    // if (
    //     req.body["first_name"] != "" &&
    //     req.body["last_name"] != "" &&
    //     req.body["signature"] != ""
    // ) {
    db.addSignature(
        req.body["first_name"],
        req.body["last_name"],
        req.body["signature"]
    )
        .then(() => {
            console.log("success");
            console.log("signature: ", req.body["signature"]);
            res.redirect("/thankyou");
        })
        .catch(err => {
            res.render("petition", {
                layout: "main",
                helpers: {
                    showError() {
                        return "PLEASE FILL OUT ALL FIELDS ....!";
                    }
                }
            });
            console.log(err);
        });
    // } else {
    //     console.log("nochmal");
    //     res.render("petition", {
    //         layout: "main",
    //         helpers: {
    //             showError() {
    //                 return "PLEASE FILL OUT ALL FIELDS ....!";
    //             }
    //         }
    //     });
    // }
});

app.get("/thankyou", (req, res) => {
    //change to "thank-you"
    db.countSignatures()
        .then(result => {
            res.render("thankyou", {
                layout: "main",
                numSignatures: result.rows[0].count
            });

            console.log("result: ", result.rows[0].count);
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/signers", (req, res) => {
    db.getSignatures()
        .then(result => {
            console.log("result signers", result.rows);
            let arrSigners = result.rows;
            res.render("signers", {
                layout: "main",
                arrSigners
            });
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(8080, () => console.log("server running"));

// post req.body enthält input fields first_name und last_name; drittes (verstecktes) input-field wird für Signature angelegt
