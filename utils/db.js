var spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

exports.getSignatures = function() {
    return db.query("SELECT first, last FROM signatures"); //returns promise!
    //change to SINGLE QUOTES!!!
};
//add security option!!

exports.countSignatures = function() {
    return db.query("SELECT COUNT(*) FROM signatures");
};

exports.addUserData = function(first_name, last_name, email, hashed_password) {
    return db.query(
        "INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
        [first_name, last_name, email, hashed_password]
    );
};

exports.addSignature = function(signature, user_id) {
    return db.query(
        "INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING user_id", //$arg prevents SQL-injection!!!
        [signature, user_id]
    );
};

exports.getSignatureImage = function(id) {
    return db.query(
        `SELECT signature FROM signatures WHERE id = ${id}` //$arg prevents SQL-injection!!!
    );
};

exports.getHashedPassword = function(email) {
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
};
