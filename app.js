var      express = require("express"),
             app = express(),
  methodOverride = require("method-override"),
expressSanitizer = require("express-sanitizer"),
        mongoose = require("mongoose"),
        passport = require("passport"),
   LocalStrategy = require("passport-local"),
         Comment = require("./models/comment"),
            User = require("./models/user"),
      bodyParser = require("body-parser");
     var session = require('express-session');
// var FileStore = require('session-file-store')(session);

// APP CONFIG
// mongoose.connect("mongodb://localhost/restful_blog_app",{useNewUrlParser:true , useUnifiedTopology: true});
mongoose.connect("mongodb+srv://aniket:aniket@blog-site.xqnsf.mongodb.net/?retryWrites=true&w=majority",
{	
	useNewUrlParser: true, 
	useUnifiedTopology: true, 
});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(expressSanitizer());
app.use(express.static("public"));
app.use(methodOverride("_method")); 

// MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
	title : String,
	image : String,
	author : String,
	body : String,
	comments : [
	 	{
	 		type : mongoose.Schema.Types.ObjectId,
	 		ref : "Comment"
	 	}
	],
	created : {type : Date , default : Date.now} 
});
var Blog = mongoose.model("Blog", blogSchema);

app.use(require("express-session")({
	secret : "New Delhi is the Capital of India",
	resave : false,
	saveUninitialized : false
}));

// app.use(session({
//     store: new FileStore({}),
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: false
// }));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});

// RESTFUL ROUTES
app.get("/", function(req, res){
	res.redirect("/blogs");
});

// INDEX ROUTE
app.get("/blogs", function(req, res){
	Blog.find({}, function(err, blogs){
		if (err){
			console.log("ERROR!!!");
		} else {
			res.render("index" , { blogs : blogs});
		}
	});
});

// NEW ROUTE
app.get("/blogs/new",isLoggedIn, function(req, res){
	res.render("new");
});

// CREATE ROUTE
app.post("/blogs", function(req, res){
	req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.create(req.body.blog, function(err, newBlog){
		if (err) {
			res.render("new");
		} else {
			res.redirect("/blogs");
		}
	});
});

// SHOW ROUTE
app.get("/blogs/:id" , function(req, res){
	Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
		if(err) {
			res.redirect("/blogs");
		} else {
			res.render("show", {blog : foundBlog});
		}
	});
});

// DELETE ROUTE
app.delete("/blogs/:id", function(req, res){
	Blog.findByIdAndRemove(req.params.id, function(err){
		if (err) {
			res.redirect("/blogs");
		} else {
			res.redirect("/blogs");
		}
	});
});

//#################################################################################################################
// COMMENT ROUTES
app.get("/blogs/:id/comments/new", isLoggedIn, function(req, res){
	Blog.findById(req.params.id, function(err, blog){
		if(err){
			console.log(err);
		} else {
			res.render("comments/new",{blog : blog});
		}
	});
});

app.post("/blogs/:id/comments", isLoggedIn, function(req, res){
	Blog.findById(req.params.id, function(err, blog){
		if (err) {
			console.log(err);
			res.redirect("/blogs");
		} else {
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				} else {
					blog.comments.push(comment);
					blog.save();
					res.redirect("/blogs/" + blog._id);
				}
			});
		}
	});
});
//#################################################################################################################

// ===============================================================
// AUTH ROUTES

// show register form
app.get("/register", function(req, res){
	res.render("register");
});

// handles sign up logic
app.post("/register", function(req, res){
	var newUser = new User({username : req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/blogs");
		});
	});
});

// show login form
app.get("/login", function(req, res){
	res.render("login");
});

// handling login logic
app.post("/login", passport.authenticate("local",{
	successRedirect : "/blogs",
	failureRedirect : "/login"
}), function(req, res){
});

// logout
app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/blogs");
});

// ===============================================================

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

app.listen(process.env.PORT || 3000, function(){
	console.log("SERVER IS RUNNING!!!");
});	