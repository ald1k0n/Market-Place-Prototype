const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const passport = require('passport');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const flash = require('express-flash');
const { Session } = require('express-session');
const multer = require('multer');
const { log } = require('console');

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(flash()); 

app.use(session({
    secret: 'Simple MarketPlace',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/marketPlace');

const cartSchema = new mongoose.Schema({
    itemName:String,
    price:String,
    user:String,
    link:String,
    img:String
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const items = new mongoose.Schema({
    username:String,
    description:String,
    date:String,
    price:Number,
    contacts:String,
    photo:String,
    title:String
});

const Items = new mongoose.model("item",items);
const Cart = new mongoose.model('cart',cartSchema);

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const storage = multer.diskStorage({
    destination:function(req,file,callback){
      callback(null,'./public/uploads');
    },
  
    filename:function(request,file,callback){
      callback(null,file.originalname);
    }
});
  
const upload = multer({
    storage:storage
});

app.get('/',function(req,res){
    Items.find(function(err,result){
        if(!err){
            res.render('index',{
                items:result
            });
        }
        else{
            console.log(err);
        }
    });
    
});

app.get('/contact',function(req,res){
    res.render('contact');
});

app.get('/profile',function(req,res){
    if(!req.isAuthenticated()){
        res.redirect('/login');
    }
    else{
        Items.find({username:req.session.passport.user},function(err,result){
            res.render('profile',{name:req.session.passport.user,result:result});
        });
    }
});

app.get('/login',function(req,res){
    res.render('login',{error:""});
});

app.post('/login',function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
       });
    
       req.login(user,function(err){
           if(err){
               console.log(err);
           }
           else{
               passport.authenticate('local')(req,res,function(err){
                   if(!err){
                    res.redirect('/profile');
                   }
                   else{
                       res.render('login',{error:"Login or password isn't defined"})
                   }
               });
           }
       })
});

app.post('/logout',function(req,res){
    req.logOut();
    res.redirect('/');
});

app.get('/create',function(req,res){
    if(req.isAuthenticated()){
        res.render('create');
        const author = req.session.passport.user;
    }
    else{
        res.redirect('/login');
    }
})

app.post('/create',upload.single('photo'),function(req,res){
    const date = new Date().toLocaleString();
    const item = new Items({
        username:req.session.passport.user,
        description:req.body.description,
        date:date,
        price:req.body.price,
        contacts:req.body.contact,
        photo:"/uploads/" + req.file.filename,
        title:req.body.title
    });
    item.save();
    res.redirect('/profile');
});

app.get('/register',function(req,res){
    res.render('register');
});

app.post('/register',function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect('/profile');
            });
        }
    });
});

app.get('/item/:id',function(req,res){
    Items.findOne({_id:req.params.id},function(err,result){
        if(!err){
            res.render('item',{items:result});
        }
        else{
            console.log(err);
        }
    });
});

app.post('/search',function(req,res){
    Items.find({title:req.body.search},function(err,items){
        if(!err){
            res.render('search',{items:items});
        }
    });
});

app.get('/items/:user',function(req,res){
    Items.find({username:req.params.user},function(err,items){
        res.render('userItem',{
            items:items
        });
    });
});

app.post('/delete',function(req,res){
    Items.deleteOne({_id:req.body.delbtn},function(err,result){
        if(!err){
            res.redirect('/profile');
        }
    });
});

app.post('/add',function(req,res){
    if(!req.isAuthenticated()){
        res.redirect('/login');
    }
    else{
        Items.findOne({_id:req.body.cart},function(err,item){
            if(!err){
                const cart = new Cart({
                    itemName:item.title,
                    price:item.price,
                    user:req.session.passport.user,
                    link:item._id,
                    img:item.photo
                });
                cart.save();
                res.redirect('/cart');
            }
        });
    }
});

app.get('/cart',function(req,res){
    if(req.isAuthenticated()){
        Cart.find({user:req.session.passport.user},function(err,items){
            res.render('cart',{
                items:items
            });
        });
        
    }
    else{
        res.redirect('/login');
    }
});

app.post('/deletecart',function(req,res){
    Cart.deleteOne({_id:req.body.delbtn},function(err){
        if(!err){
            res.redirect('/cart');
        }
    });
});

app.get('/admin',function(req,res){
    if(req.isAuthenticated() && req.session.passport.user ==="ALDIK")
    {
        User.find({},function(err,users){
            if(!err){
                Items.find({},function(err,items){
                    if(!err){
                        console.log(users,items);
                        res.render('admin',{users:users,items:items});
                    }
                })
                
            }
            
        });
        
    } 
    else{
        res.redirect('/');
    }
});

app.post('/delUser',function(req,res){
    User.deleteOne({_id:req.body.delbtn},function(err){
        if(!err){
            res.redirect('/admin');
        }
        
    });
});

app.post('/deleteOnS',function(req,res){
    Items.deleteOne({_id:req.body.delbtn},function(err){
        if(!err){
            res.redirect('/admin');
        }
    })
});

app.listen(3000);