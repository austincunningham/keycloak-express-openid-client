'use strict';

import express from 'express';
import { Issuer, Strategy } from 'openid-client';
import passport from 'passport';
import expressSession from 'express-session';
import { engine } from 'express-handlebars';


const app = express();

// Register 'handelbars' extension with The Mustache Express
app.engine('hbs', engine({extname:'hbs',
        defaultLayout:'layout.hbs'
    })
);
app.set('view engine', 'hbs');


const keycloakIssuer = await Issuer.discover('http://localhost:8080/realms/keycloak-express')
// don't think I should be console.logging this but its only a demo app
// nothing bad ever happens from following the docs :)
console.log('Discovered issuer %s %O', keycloakIssuer.issuer, keycloakIssuer.metadata);

const client = new keycloakIssuer.Client({
    client_id: 'keycloak-express',
    client_secret: 'long_secret-here',
    redirect_uris: ['http://localhost:3000/auth/callback'],
    post_logout_redirect_uris: ['http://localhost:3000/logout/callback'],
    response_types: ['code'],
  });

var memoryStore = new expressSession.MemoryStore();
app.use(
    expressSession({
    secret: 'another_long_secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
    })
);

app.use(passport.initialize());
app.use(passport.authenticate('session'));

passport.use('oidc', new Strategy({client}, (tokenSet, userinfo, done)=>{
        return done(null, tokenSet.claims());
    })
)

passport.serializeUser(function(user, done) {
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

//unprotected route
app.get('/',function(req,res){
    res.render('index');
});

// start logout request
app.get('/logout', (req, res) => {
    res.redirect(client.endSessionUrl());
});

// logout callback
app.get('/logout/callback', (req, res) => {
    // clears the persisted user from the local storage
    req.logout();
    // redirects the user to a public route
    res.redirect('/');
});

app.listen(3000, function () {
  console.log('Listening at http://localhost:3000');
});

