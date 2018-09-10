var middlewareObj = {};

//check for user login
middlewareObj.isLoggedIn = (req, res, next) => {
    req.isAuthenticated() ? next() : res.redirect("/");
};

module.exports = middlewareObj;