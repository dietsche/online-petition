const supertest = require("supertest");
const app = require("./index.js");
const cookieSession = require("cookie-session");

test("Users who are logged out are redirected to the registration page when they attempt to go to the signature page", () => {
    cookieSession.mockSessionOnce({
        userId: undefined
    });
    return supertest(app)
        .get("/signature")
        .then(res => {
            expect(res.headers.location).toBe("/registration");
        });
});

test("Users who are logged in are redirected to the signature page when they attempt to go the registration page", () => {
    cookieSession.mockSessionOnce({
        userId: 1
    });
    return supertest(app)
        .get("/registration")
        .then(res => {
            expect(res.headers.location).toBe("/signature");
        });
});

test("Users who are logged in are redirected to the signature page when they attempt to go the login page", () => {
    cookieSession.mockSessionOnce({
        userId: 1
    });
    return supertest(app)
        .get("/login")
        .then(res => {
            expect(res.headers.location).toBe("/signature");
        });
});

test("Users who are logged in and have signed the petition are redirected to 'thank you' when they attempt to go to signature", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        signed: true
    });
    return supertest(app)
        .get("/signature")
        .then(res => {
            expect(res.headers.location).toBe("/thank-you");
        });
});

test("Users who are logged in and have signed the petition are redirected to 'thank you' when they attempt to submit a signature", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        signed: true
    });
    return supertest(app)
        .post("/signature")
        .then(res => {
            expect(res.headers.location).toBe("/thank-you");
        });
});

test("Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to the thank you page", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        signed: false
    });
    return supertest(app)
        .get("/thank-you")
        .then(res => {
            expect(res.headers.location).toBe("/signature");
        });
});

test("Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to the signers page", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        signed: false
    });
    return supertest(app)
        .get("/signers")
        .then(res => {
            expect(res.headers.location).toBe("/signature");
        });
});
