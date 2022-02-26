
# Keycloak Express openid-client

How to use Keycloak in Express using OIDC

## Install

```bash
npm install
npm start
```

>**NOTE:** Keycloak is [deprecating](https://www.keycloak.org/2022/02/adapter-d**eprecation) their client adapters (keycloak-connect) for Node and recommending openid-client as a replacement.

## Setup Keycloak
First I [download keycloak](https://www.keycloak.org/downloads) extract it and you can run it with the following command
```bash
bin/kc.sh start-dev
```
You can then login http://localhost:8080, first time you do keycloak asks you to set an admin user and password. 

Create a Realm and give it an name and create it. I am using keycloak-express for my realm name
![Create realm](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e0erj948wmmrbng0v14l.gif)

The create a Client using openid-connect in the Realm
![Create a client](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wctbp51o639k3hgu16q0.gif)

Set the Valid Redirect URIs and select save, 
![set valid redirect URIs](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/07crr8q4tmtovxodehgq.gif)

>**NOTE**:you can specify specific routes here but I am using a wild card(not recommend best practice)

Create a user its documented [here](https://www.keycloak.org/docs/latest/server_admin/index.html#proc-creating-user_server_administration_guide) so I won't go into it.

That's it for Keycloak setup 

## Setup Openid-client with Passport in Express

We are going to use this [openid-client](https://www.npmjs.com/package/openid-client) and [passport](https://www.npmjs.com/package/passport) to connect to keycloak.

From the Realm we need the openid-configuration can be got an endpoint 
```
/realms/{realm-name}/.well-known/openid-configuration
```
So in my case the realm name is keycloak-express so the url will be http://localhost:8080/realms/keycloak-express/.well-known/openid-configuration the output is as follows
![.well-known url output](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ruaxgvsvycdhubwhm7b1.png) 
All we need for is the `issuer:"http://localhost:8080/realms/keycloak-express"` url to connect openid-client to keycloak as follows

```js
'use strict';

import express from 'express';
import { Issuer, Strategy } from 'openid-client';
import passport from 'passport';
import expressSession from 'express-session';

const app = express();

// use the issuer url here
const keycloakIssuer = await Issuer.discover('http://localhost:8080/realms/keycloak-express');


// client_id and client_secret can be what ever you want
// may be worth setting them up as env vars 
const client = new keycloakIssuer.Client({
    client_id: 'keycloak-express',
    client_secret: 'long_secret-here',
    redirect_uris: ['http://localhost:3000/auth/callback'],
    post_logout_redirect_uris: ['http://localhost:3000/logout/callback'],
    response_types: ['code'],
  });
```
