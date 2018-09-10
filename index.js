var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer");
    
//database and passport variables
var Biomarker = require("./models/biomarker"),
    LocalStrategy = require("passport-local"),
    middleware = require("./middleware"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    User = require("./models/user");

require("dotenv").config();

mongoose.connect(process.env.DATABASE, {useNewUrlParser: true});
    
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.static('views'));
app.use(methodOverride("_method"));
app.use(expressSanitizer());

// passport config
app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//CORS configuration; may want to change origin allowed from all to specific once in production
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
});

//login/logout routes
//redirect to login page
app.get('/', (req, res) => res.redirect('/login'));

//login page
app.get('/login', (req, res) => res.render('index', {page: 'index'}));

//login post
app.post('/login', passport.authenticate('local', {
    successRedirect: '/biomarkers',
    failureRedirect: '/'
}), (req, res) => {});

//logout route
app.get('/logout', (req, res) => {
   req.logout();
   res.redirect('/login');
});

//end of login/logout routes

//api route
app.get('/api/biomarkers', (req, res) => {
   Biomarker.find({}, (err, allBiomarkers) => {
       err ? res.redirect('/') : res.json(allBiomarkers);
   });
});
//end of api route


//biomarker REST routes
//view all biomarkers
app.get('/biomarkers', middleware.isLoggedIn, (req, res) => {
  Biomarker.find({}, (err, allBiomarkers) => {
      err ? res.redirect('/') : res.render("biomarkers", {allBiomarkers:allBiomarkers});
  }); 
});

//create new biomarker
app.get('/biomarkers/new', middleware.isLoggedIn, (req, res) => res.render("new"));

//sanitize data from user and add each process to array
app.post('/biomarkers', middleware.isLoggedIn, (req, res) => {
    var processesArr = [];
    var newBiomarker;
    req.body.bio.marker = req.sanitize(req.body.bio.marker);
    for(var num = Object.keys(req.body.bio.process).length-1; num >= 0; num--)
    {
        req.body.bio.process[num] = req.sanitize(req.body.bio.process[num]);
        processesArr.push(req.body.bio.process[num]);
    }
    newBiomarker = {marker: req.body.bio.marker, processes: processesArr};
    Biomarker.create(newBiomarker, (err, newBio) => {
       err ? res.redirect('/biomarkers') : res.redirect('/biomarkers');
    });
});

//find selected biomarker (selected by clicking dna icon) and load edit page
app.get('/biomarkers/:id/edit', middleware.isLoggedIn, (req, res) => {
    Biomarker.findById(req.params.id, (err, marker) => {
        err ? res.redirect('/biomarkers') : res.render("edit", {marker:marker});
    });
});

//sanitize input from user and add updated processes to array
app.put('/biomarkers/:id', middleware.isLoggedIn, (req, res) => {
    var processesArr = [];
    var updateBiomarker;
    req.body.bio.marker = req.sanitize(req.body.bio.marker);
    for(var num = Object.keys(req.body.bio.process).length-1; num >= 0; num--)
    {
        console.log(req.body.bio.process[num]);
        req.body.bio.process[num] = req.sanitize(req.body.bio.process[num]);
        processesArr.push(req.body.bio.process[num]);
    }
    updateBiomarker = {marker: req.body.bio.marker, processes: processesArr};
    Biomarker.findByIdAndUpdate(req.params.id, updateBiomarker, (err, updatedBio) => {
        err ? res.redirect('/biomarkers') : res.redirect(`/biomarkers/${req.params.id}/edit`);
    });
});

//remove selected biomarker
app.delete('/biomarkers/:id', middleware.isLoggedIn, (req, res) => {
   Biomarker.findByIdAndRemove(req.params.id, (err) => {
       err ? res.redirect('/biomarkers') : res.redirect('/biomarkers');
   }); 
});
//end of biomarker REST routes

app.listen(process.env.PORT, process.env.IP, () => console.log(`Running on port ${process.env.PORT}`));