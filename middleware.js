exports.requireLoggedInUser = function(req, res, next) {
    if (
        !req.session.userId &&
        req.url != "/registration" &&
        req.url != "/login"
    ) {
        res.redirect("/registration");
    } else {
        next();
    }
};

exports.requireLoggedOutUser = function(req, res, next) {
    if (req.session.userId) {
        let userId = req.session.userId;
        res.redirect("/signature");
    } else {
        next();
    }
};

exports.requireNoSignature = function(req, res, next) {
    if (req.session.signed) {
        let signed = true;
        res.redirect("/thank-you");
    } else {
        next();
    }
};

exports.requireSignature = function(req, res, next) {
    if (!req.session.signed) {
        res.redirect("/signature");
    } else {
        next();
    }
};
