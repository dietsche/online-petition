const express = require("express");
const hb = require("express-handlebars");
const db = require("./utils/db");
const cookieSession = require("cookie-session");
const csurf = require("csurf"); //follow instructions!!!
const { hash, compare } = require("./utils/bc");
const app = express();

let signatureURL;

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

app.get("/", (req, res) => {
    console.log("*************** /route ******************");
    console.log("req.session: ", req.session);
    console.log("req.session: ", req.session);
    console.log("**************** /route *****************");
    res.render("petition", {
        layout: "main"
    });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    let userUrl = req.body["url"];
    if (
        !req.body["url"].startsWith("https://") ||
        !req.body["url"].startsWith("http://")
    ) {
        userUrl = "http://" + req.body["url"];
    }
    console.log("userUrl: ", userUrl);
    db.addUserProfile(
        req.body["age"],
        req.body["city"],
        userUrl,
        req.session.userId
    )
        .then(() => {
            res.redirect("/");
        })

        .catch(err => {
            // if insert fails rerender template with err message

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

app.post("/", (req, res) => {
    console.log("request: ", req.body);
    db.addSignature(
        req.body["signature"],
        req.session.userId
        // modifiy!!! alter your route, so that you pass userId from the cooke to qour query instad of first and last;
    )
        .then(result => {
            console.log("success");
            console.log("result: ", result);

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

app.get("/thank-you", (req, res) => {
    console.log("*************** /thanks ******************");
    console.log("req.session: ", req.session);
    console.log("**************** /thanks *****************");

    db.getSignatureImage(req.session.userId)
        .then(result => {
            signatureURL = result.rows[0].signature;
            console.log("SIGN HIER??? ", result.rows[0].signature); //warum ist result nicht direkt signature???
        })
        .then(() => {
            db.countSignatures().then(result => {
                res.render("thank-you", {
                    layout: "main",
                    signatureURL,
                    numSignatures: result.rows[0].count
                });

                console.log("result: ", result.rows[0].count);
            });
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/signers", (req, res) => {
    db.getUserData()
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

app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    console.log("req.params.city: ", req.params.city);
    db.getUserDataByCity(city)
        .then(result => {
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
// const { city } = req.params;
// const selectedProject = projects.find(
//     item => item.directory.slice(1) == projectName
// );
// if (!selectedProject) {
//     return res.sendStatus(404);
// }

app.get("/registration", (req, res) => {
    res.render("registration", {
        layout: "main"
    });
});

app.post("/registration", (req, res) => {
    hash(req.body["password"])
        .then(result => {
            let hashedPassword = result;
            console.log("hashedPassword: ", hashedPassword);

            db.addUserData(
                req.body["first_name"],
                req.body["last_name"],
                req.body["email"],
                hashedPassword
            ).then(result => {
                console.log("result.id ", result.rows[0].id);
                req.session.userId = result.rows[0].id;
                res.redirect("/profile");
            });
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

// >> INSERT query in users table

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", (req, res) => {
    let email = req.body["email"];
    console.log("email: ", req.body["email"]);
    db.getHashedPassword(email)
        .then(result => {
            let savedPassword = result.rows[0].password;
            // console.log("id: ", result.rows[0].id);
            let userId = result.rows[0].id;
            // console.log("savedPassword: ", savedPassword);
            compare(req.body["password"], savedPassword).then(result => {
                // console.log(result);
                if (result == true) {
                    req.session.userId = userId;
                    console.log("true");
                    db.checkIfSigned(req.session.userId).then(result => {
                        console.log("checkIfSigned result: ", result);
                        if (result.rows[0] && result.rows[0]["user_id"]) {
                            console.log("redirect thanks");
                            res.redirect("/thank-you");
                        } else if (!result.rows[0]) {
                            res.redirect("/");
                            console.log("redirect petition");
                        }
                    });

                    // do a db query to find out if user signed > put their sigID in a cookie & redirect to "thanks"; if not: redirect to "petition"
                } else if (result == false) {
                    //render err message ("incorrect password")
                }
            });
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

// >> SEECT  to get user infor ba amail address
// >> SELECT from signatures to find out if they-ve signed

app.listen(8080, () => console.log("server running"));

// post req.body enthält input fields first_name und last_name; drittes (verstecktes) input-field wird für Signature angelegt

//see signature again

//dynamic routes with params!
