const bcrypt = require("bcryptjs");
const { promisify } = require("util");

const hash = promisify(bcrypt.hash);
const genSalt = promisify(bcrypt.genSalt);

// will be called in the POST REGISTRATION route (FIRST thing in this route!)
exports.hash = password => genSalt().then(salt => hash(password, salt));

// will be called in the POST LOGIN route
exports.compare = promisify(bcrypt.compare);

// COMPARE takes 2 argumente: password user sends from the client - hashed password from database
