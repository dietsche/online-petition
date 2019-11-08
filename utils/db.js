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

exports.addSignature = function(first_name, last_name, signature) {
    return db.query(
        "INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3)", //$arg prevents SQL-injection!!!
        [first_name, last_name, signature]
    );
};
