const name = 'WEB RTC';
const PORT = process.env.PORT || 4000;
const SSLPORT = process.env.SSLPORT || 443;

var morgan   = require('morgan'),
    assert   = require('assert'),
    os       = require('os'),
    socketIO = require('socket.io'),
    http     = require('http'),
    https    = require('https'),
    fs       = require('fs'),
    Routes   = require('./routes.js'),
    mongoose = require('mongoose'),
    express  = require('express'),
    bp       = require('body-parser'),
    path     = require('path'),
    sessions = require('client-sessions')({
        cookieName: "rustuck-session",  // front-end cookie name, currently pulled from package.json, feel free to change
        secret: '@NyT1M3',              // the encryption password : keep this safe
        requestKey: 'session',          // req.session,
        duration: (86400 * 1000) * 7,   // one week in milliseconds
        cookie: {
            ephemeral: false,           // when true, cookie expires when browser is closed
            httpOnly: true,             // when true, the cookie is not accesbile via front-end JavaScript
            secure: false               // when true, cookie will only be read when sent over HTTPS
        }
    }), // encrypted cookies!
    credentials = {
        key: fs.readFileSync('./cert/key.pem', 'utf8'),
        cert: fs.readFileSync('./cert/cert.pem', 'utf8')
    };

mongoose.createConnection('mongodb://localhost/rustuck');

var app = express();

app.use(
    morgan('dev'),
    sessions,
    bp.json(),
    bp.urlencoded({ extended: true })
);

// this middleware can redirect all traffic to HTTPs, but be sure to mount it BEFORE express.static middleware!!!
app.all('*', ( req, res, next ) => {
    if( req.protocol === 'http' ) {
        res.set('X-Forwarded-Proto','https');
        res.redirect('https://'+ req.headers.host + req.url);
    } else {
        next();
    }
});

Routes(app);

module.exports = {
    HTTP  : http.createServer(app).listen(PORT, serverUp),
    HTTPS : https.createServer(credentials, app).listen(SSLPORT, serverUp)
};

function serverUp() {
    console.info('[INFO] Server Up:', this._connectionKey);
}
