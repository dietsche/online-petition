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

app.post("/", (req, res) => {
    console.log("request: ", req.body);
    db.addSignature(
        req.body["first_name"],
        req.body["last_name"],
        req.body["signature"]
        // modifiy!!! alter your route, so that you pass userId from the cooke to qour query instad of first and last;
    )
        .then(result => {
            console.log("success");
            console.log("current id: ", result.rows[0].id);
            req.session.id = result.rows[0].id;
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
//>> INSERT for sugnatrures table need to be changes to include the user_id

app.get("/thank-you", (req, res) => {
    console.log("*************** /thanks ******************");
    console.log("req.session: ", req.session);
    console.log("**************** /thanks *****************");

    // db.countSignatures()
    //     .then(result => {
    //         res.render("thankyou", {
    //             layout: "main",
    //             numSignatures: result.rows[0].count
    //         });
    //
    //         console.log("result: ", result.rows[0].count);
    //     })
    //     .catch(err => {
    //         console.log(err);
    //     });

    db.getSignatureImage(req.session.id)
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

// app.get("register", (req, res) => {
//render registration page     })
// });

// app.post("register", (req, res) => {
//      console.log(req.body); >> grab the user input!!! })
//      hash the user password
//      insert a row in USERS table
//      if insert is successful, add 'userId' in a cookie (value should be the id created by postgres when row was inserted)
//      if insert fails rerender template with err message

// });

// >> INSERT query in users table

// app.get("login", (req, res) => {
//render login page     })
// });

// app.post("login", (req, res) => {
// get the users stored hashed pw from db, usind the users email adress
// pass the hashed pw to compare along with the pw the user typed in input field
// if they match > compare returns true; if not: false (>rerender with err message);
// if true: add user id to cookie (req.session.userId =...)
// do a db query to find out if user signed > put their sigID in a cookie & redirect to "thanks"; if not: redirect to "petition"

//     })
// });

// >> SEECT  to get user infor ba amail address
// >> SELECT from signatures to find out if they-ve signed

//in POST REQUEST!!!!!!:
// app.get("register", (req, res) => {
//     hash("hello").then(hashedPassword => {
//         console.log("hashedPassword: ", hashedPassword));
//         then.redirect("...");
//     })
// });

app.listen(8080, () => console.log("server running"));

// post req.body enthält input fields first_name und last_name; drittes (verstecktes) input-field wird für Signature angelegt

//see signature again
