var spicedPg = require("spiced-pg");
var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

exports.getSignatures = function() {
    return db.query("SELECT first, last FROM signatures"); //returns promise!
};
//add security option!!

exports.getUserAndProfileData = function(userId) {
    return db.query(
        `SELECT first, last, email, age, city, url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE user_profiles.user_id = $1`,
        [userId]
    );
};

exports.updateUserData = function(userId, first, last, email) {
    return db.query(
        `UPDATE users
        SET first = $2, last = $3, email = $4
        WHERE id = $1`,
        [userId, first, last, email]
    );
};

exports.updateProfileData = function(age, city, url, user_id) {
    return db.query(
        `INSERT INTO user_profiles (city, age, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET city = $1, age = $2, url = $3`,
        [city, age, url, user_id]
    );
};

exports.deleteSignature = function(user_id) {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [user_id]);
};
//>> gehr nur mit UNIQUE-Werten

exports.getUserData = function() {
    return db.query(
        `SELECT first, last, city, url
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        JOIN user_profiles
        ON users.id = user_profiles.user_id`
    );
};

exports.getUserDataByCity = function(city) {
    return db.query(
        `SELECT first, last, city, url
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1)`,
        [city]
    );
};

exports.checkIfSigned = function(userId) {
    return db.query(`SELECT user_id FROM signatures WHERE user_id = $1`, [
        userId
    ]);
};

exports.countSignatures = function() {
    return db.query("SELECT COUNT(*) FROM signatures");
};

exports.addUserData = function(first_name, last_name, email, hashed_password) {
    return db.query(
        "INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
        [first_name, last_name, email, hashed_password]
    );
};

exports.addUserProfile = function(age, city, url, user_id) {
    return db.query(
        "INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4)",
        [age, city, url, user_id]
    );
};

exports.updatePassword = function(userId, hashed_password) {
    return db.query(
        `UPDATE users
        SET password = $2
        WHERE id = $1`,
        [userId, hashed_password]
    );
};

//hier wird immer wieder die gleiche sign + id in die DB geschrieben!
exports.addSignature = function(signature, user_id) {
    return db.query(
        "INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING user_id", //$arg prevents SQL-injection!!!
        [signature, user_id]
    );
};

exports.getSignatureImage = function(userId) {
    return db.query(
        `SELECT signature FROM signatures WHERE user_id = ${userId}` //$arg prevents SQL-injection!!!
    );
};

exports.getHashedPassword = function(email) {
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
};

// SELECT
// WHERE city = $1
// becomes =>
// WHERE LOWER(city) = LOWER($1)
