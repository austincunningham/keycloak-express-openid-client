'use strict';

import express, { application } from 'express';
import { Issuer, Strategy } from 'openid-client';
import passport from 'passport';
import expressSession from 'express-session';
import { engine } from 'express-handlebars';
// Use body-parser
import bodyParser from 'body-parser';


var TokenSet
const app = express();

// Register 'handelbars' extension with The Mustache Express
app.engine('hbs', engine({extname:'hbs',
        defaultLayout:'layout.hbs'
    })
);
app.set('view engine', 'hbs');

// use the issuer url here
const keycloakIssuer = await Issuer.discover("http://127.0.0.1:8080/realms/keycloak-express")
//const keycloakIssuer = await Issuer.discover("http://"+ process.env.DOCKERHOST +":8080/realms/keycloak-express")
// don't think I should be console.logging this but its only a demo app
// nothing bad ever happens from following the docs :)
console.log('Discovered issuer %s %O', keycloakIssuer.issuer, keycloakIssuer.metadata);

const client = new keycloakIssuer.Client({
    client_id: 'keycloak-express',
    client_secret: 'long_secret-here',
    redirect_uris: ['http://127.0.0.1:3000/auth/callback'],
    post_logout_redirect_uris: ['http://127.0.0.1:3000/logout/callback'],
    response_types: ['code'],
  });

var memoryStore = new expressSession.MemoryStore();
app.use(
    expressSession({
    secret: 'another_long_secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    })
);


app.use(passport.initialize());
app.use(passport.authenticate('session'));
app.use(bodyParser.json());

passport.use('oidc', new Strategy({client}, (tokenSet, userinfo, done)=>{
        console.log("tokenset:",tokenSet)
        TokenSet = tokenSet;
        return done(null, tokenSet.claims());
    })
)

passport.serializeUser(function(user, done) {
    console.log("user:",user)
    done(null, user);
  });
passport.deserializeUser(function(user, done) {
    done(null, user);
});



// default protected route /test
app.get('/test', (req, res, next) => {
    passport.authenticate('oidc')(req, res, next);
});

// callback always routes to test 
app.get('/auth/callback', (req, res, next) => {
    passport.authenticate('oidc', {
      successRedirect: '/testauth',
      failureRedirect: '/'
    })(req, res, next);
});

// function to check weather user is authenticated, req.isAuthenticated is populated by password.js
// use this function to protect all routes
var checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { 
        return next() 
    }
    res.redirect("/test")
}

app.get('/testauth', checkAuthenticated, (req, res) => {
    res.render('test');
});

app.get('/other', checkAuthenticated, (req, res) => {
    res.render('other');
});

app.get('/api/status', checkAuthenticated, (req, res) => {
    res.status(200).json({status: "up"});
});

//unprotected route
app.get('/',function(req,res){
    res.render('index');
});

// start logout request
app.get('/logout', (req, res) => {
    res.redirect(client.endSessionUrl({
        id_token_hint: TokenSet.id_token
    }
    ));
});

// logout callback
app.get('/logout/callback', (req, res) => {
    // clears the persisted user from the local storage
    req.logout();
    // redirects the user to a public route
    res.redirect('/');
});


app.listen(3000, function () {
  console.log('Listening at http://127.0.0.1:3000');
});

