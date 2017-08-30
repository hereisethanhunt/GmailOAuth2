var http = require('http');
var express = require('express');
var session = require('express-session');
var google = require('googleapis');
var plus = google.plus('v1');
var fs = require('fs');
var OAuth2 = google.auth.OAuth2;
const ClientId = "467062560323-vub2ikkuv1nm7t6upt7l0mseqj7lpm81.apps.googleusercontent.com";
const ClientSecret = "Ff5OPS3Gt_HDW40jFD2L7z_e";
const RedirectionUrl = "http://localhost:1234/oauthCallback";
var googleAuth = require('google-auth-library');
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
var app = express();

app.use(session({
    secret: 'vishal-bisht-app-secretKey-04121994',
    resave: true,
    saveUninitialized: true
}));

/*fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  authorize(JSON.parse(content), listLabels);
});*/

function getOAuthClient () {
    return new OAuth2(ClientId ,  ClientSecret, RedirectionUrl);
}

function getAuthUrl () {
    var oauth2Client = getOAuthClient();
    var scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });

    return url;
}

app.use("/oauthCallback", function (req, res) {
    var oauth2Client = getOAuthClient();
    var code = req.query.code;
    var session = req.session;
    if(!session.token)
    {
        console.log("fetching token from google");
        oauth2Client.getToken(code, function(err, tokens) {
            if(!err) {
                oauth2Client.setCredentials(tokens);
                storeToken(tokens);
                session.token = tokens;
                console.log("token saved as session and as a file");
                res.send("<h3>Login successful!!</h3><a href='/details'>Go to details page</a>");
            }
            else{
                res.send(`<h3>Login failed!!</h3>`);
            }
        });
    }
    else
    {
        console.log("already fetched token from the fs file");
        res.send("<h3>Login successful!!</h3><a href='/details'>Go to details page</a>");
    }
});

function storeToken(token) {

    try {fs.mkdirSync(TOKEN_DIR);} 
    catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

app.get("/details", function (req, res) {
    var oauth2Client = getOAuthClient();
    var code = req.query.code;
    var session = req.session;
    console.log(session.token);
    res.send("<h1>Authenticated using google oAuth</h1>");
    oauth2Client.setCredentials((session.token));
    
    var gmail = google.gmail('v1');
    gmail.users.labels.list({
        auth: oauth2Client,
        userId: 'me',
        }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var labels = response.labels;
        if (labels.length == 0) {
            console.log('No labels found.');
        } else {
            console.log('Labels:');
            for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                console.log('- %s', label.name);
            }
        }
    });
});


app.get("/", function (req, res) {
    var oauth2Client = getOAuthClient();
    var session = req.session;
    
    if (fs.existsSync(TOKEN_PATH)) {
    var token = (fs.readFileSync(TOKEN_PATH,'utf8'));
    console.log("fetching token from saved fs file");
        oauth2Client.setCredentials(token);
        session.token=JSON.parse(token);
        console.log(session.token);
        res.send("<h1>Authentication using google oAuth</h1><a href='/oauthCallback'>Login</a>");
    }
    else
    {
        console.log("token not found in file system... contacting google");      
        var url = getAuthUrl();
        res.send("<h1>Authentication using google oAuth</h1><a href="+url+">Login</a>");
    }
 
});


var port = 1234;
var server = http.createServer(app);
server.listen(port);
server.on('listening', function () {
    console.log(`listening to ${port}`);
});
