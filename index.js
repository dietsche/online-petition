const express = require("express");
const app = express();
module.exports = app; //export for testing
const hb = require("express-handlebars");
const db = require("./utils/db");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hash, compare } = require("./utils/bc");
const {
    requireSignature,
    requireNoSignature,
    requireLoggedOutUser,
    requireLoggedInUser
} = require("./middleware");

let signatureURL;
let arrUserData;
let userId;
let signed;

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false //allows us to read the body of the post request
    })
);
app.use(
    cookieSession({
        secret: `I'm always angry.`, //export from  secrets.json-file
        maxAge: 1000 * 60 * 60 * 24 * 14 //14 days
    })
);

app.use(csurf()); //has to be after express.urlencoded (body needs to be there!) and after cookieSession! > will look after a token after every request (not GET but POST)

app.use(function(req, res, next) {
    // res.setHeader('x-frame-options', 'DENY'); >>> verhindert Clickbaiting / using in a Frame
    res.locals.csrfToken = req.csrfToken();

    // res.locals.first_name = req.session.firstName; >>> auf jeder Seite verfügbar!!! z.B. um Nutzer zu begrüßen ("hallo ....");
    next();
});

app.use(requireLoggedInUser);

app.get("/", (req, res) => {
    if (req.session.userId) {
        res.redirect("/login");
    } else {
        res.redirect("/registration");
    }
});

app.get("/login", (req, res) => {
    req.session.userId = null;
    req.session.signed = null;

    res.render("login", {
        layout: "main"
    });
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    let email = req.body["email"];
    //promise-all and afterwards redirect
    db.getHashedPassword(email)
        .then(result => {
            let savedPassword = result.rows[0].password;
            userId = result.rows[0].id;
            compare(req.body["password"], savedPassword).then(result => {
                // console.log(result);
                if (result == true) {
                    req.session.userId = userId;
                    db.checkIfSigned(req.session.userId).then(result => {
                        console.log("checkIfSigned result: ", result);
                        if (result.rows[0] && result.rows[0]["user_id"]) {
                            console.log("redirect thanks");
                            req.session.signed = req.session.userId;
                            signed = true;
                            console.log("set signed to TRUE");
                            res.redirect("/thank-you");
                        } else if (!result.rows[0]) {
                            res.redirect("/signature");
                            console.log("redirect petition");
                        }
                    });
                } else if (result == false) {
                    res.render("login", {
                        layout: "main",
                        helpers: {
                            showError() {
                                return "invalid password - please try again";
                            }
                        }
                    });
                }
            });
        })

        .catch(err => {
            res.render("login", {
                layout: "main",
                helpers: {
                    showError() {
                        return "Something went wrong! Please try again and fill out all fields.";
                    }
                }
            });
            console.log(err);
        });
});

app.get("/registration", requireLoggedOutUser, (req, res) => {
    req.session.userId = null;
    req.session.signed = null;

    res.render("registration", {
        layout: "main"
    });
});

app.post("/registration", requireLoggedOutUser, (req, res) => {
    hash(req.body["password"]).then(result => {
        let hashedPassword = result;

        db.addUserData(
            req.body["first_name"],
            req.body["last_name"],
            req.body["email"],
            hashedPassword
        )
            .then(result => {
                req.session.userId = result.rows[0].id;
                userId = result.rows[0].id;
                res.redirect("/profile");
            })
            .catch(err => {
                // if insert fails rerender template with err message

                res.render("registration", {
                    layout: "main",
                    helpers: {
                        showError() {
                            return "Something went wrong! Please try again and fill out all fields.";
                        }
                    }
                });
                console.log(err);
            });
    });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    let city = req.body["city"];
    let age = null;
    if (req.body["age"]) {
        age = req.body["age"];
    }
    let userUrl = "";
    if (
        req.body["url"] &&
        (!req.body["url"].startsWith("https://") ||
            !req.body["url"].startsWith("http://"))
    ) {
        userUrl = "http://" + req.body["url"];
    }

    db.addUserProfile(age, city, userUrl, req.session.userId)
        .then(() => {
            res.redirect("/signature");
        })

        .catch(err => {
            res.render("profile", {
                layout: "main",
                helpers: {
                    showError() {
                        return "Something went wrong! Please try again and fill out all fields.";
                    }
                }
            });
            console.log(err);
        });
});

app.get("/edit", (req, res) => {
    db.getUserAndProfileData(req.session.userId)
        .then(result => {
            arrUserData = result.rows;
            res.render("edit", {
                layout: "main",
                signed,
                userId,
                arrUserData
            });
        })
        .catch(err => {
            //add Err message in case fields are empty
            console.log(err);
        });
});

app.post("/edit", (req, res) => {
    if (req.body["password"] !== "") {
        hash(req.body["password"])
            .then(result => {
                let hashedPassword = result;
                return Promise.all([
                    db.updateProfileData(
                        req.body["age"],
                        req.body["city"],
                        req.body["url"],
                        req.session.userId
                    ),
                    db.updateUserData(
                        req.session.userId,
                        req.body["first_name"],
                        req.body["last_name"],
                        req.body["email"]
                    ),
                    db.updatePassword(req.session.userId, hashedPassword)
                ]);
            })
            .then(() => {
                if (req.session.signed === req.session.userId) {
                    res.redirect("/thank-you");
                } else {
                    res.redirect("/signature");
                }
            })
            .catch(err => {
                res.render("edit", {
                    layout: "main",
                    arrUserData,
                    helpers: {
                        showError() {
                            return "Something went wrong! Please try again and fill out all fields.";
                        }
                    }
                });
                console.log(err);
            });
    } else {
        return Promise.all([
            db.updateProfileData(
                req.body["age"],
                req.body["city"],
                req.body["url"],
                req.session.userId
            ),
            db.updateUserData(
                req.session.userId,
                req.body["first_name"],
                req.body["last_name"],
                req.body["email"]
            )
        ])
            .then(() => {
                if (req.session.signed === req.session.userId) {
                    res.redirect("/thank-you");
                } else {
                    res.redirect("/signature");
                }
            })
            .catch(err => {
                res.render("edit", {
                    layout: "main",
                    arrUserData,
                    helpers: {
                        showError() {
                            return "Something went wrong! Please try again and fill out all fields.";
                        }
                    }
                });
                console.log(err);
            });
    }
});

app.get("/signature", requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main",
        userId
    });
});

app.post("/signature", requireNoSignature, (req, res) => {
    db.addSignature(req.body["signature"], req.session.userId)
        .then(result => {
            console.log("success");
            req.session.signed = req.session.userId;
            signed = true;

            console.log("current id: ", result.rows[0]["user_id"]);
            res.redirect("/thank-you");
        })
        .catch(err => {
            res.render("petition", {
                layout: "main",
                helpers: {
                    showError() {
                        return "Something went wrong! Please try again and fill out all fields.";
                    }
                }
            });
            console.log(err);
        });
});

app.get("/thank-you", requireSignature, (req, res) => {
    db.getSignatureImage(req.session.userId)
        .then(result => {
            signatureURL = result.rows[0].signature;
        })
        .then(() => {
            db.countSignatures().then(result => {
                res.render("thank-you", {
                    layout: "main",
                    signatureURL,
                    signed,
                    userId,
                    numSignatures: result.rows[0].count
                });
            });
        })
        .catch(err => {
            console.log(err);
        });
});

app.post("/thank-you", requireSignature, (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(() => {
            req.session.signed = null;
            signed = false;
            res.redirect("/signature");
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/signers", requireSignature, (req, res) => {
    db.getUserData()
        .then(result => {
            let arrSigners = result.rows;
            res.render("signers", {
                layout: "main",
                signed,
                userId,
                arrSigners
            });
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/signers/:city", requireSignature, (req, res) => {
    const { city } = req.params;
    let citySelection = city;
    db.getUserDataByCity(city)
        .then(result => {
            let arrSigners = result.rows;
            res.render("signers", {
                layout: "main",
                arrSigners,
                userId,
                citySelection
            });
        })
        .catch(err => {
            console.log(err);
        });
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080);
}

// app.listen(process.env.PORT || 8080, () => console.log("server running"));

//what to do if the user hasn't submitted a new Password
// - query to update "users" and another query to update "user_profiles"
// - users: update everything
// - user_profile: optional, wir wissen nicht, ob profile schon angelegt; entweder: INSERT oder UPDATE
