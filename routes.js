var Question = require('./controllers/question.js'),
    Auth     = require('./controllers/auth.js'),
    express  = require('express');

module.exports = (app) => {
    // app.get('/register')
    // http//localhost:3000/register
    app.post('/register', Auth.register);
    app.post('/login', Auth.login);

    app.get('/whoami', Auth.whoami);
    app.get('/logout', Auth.logout);

    app.get('/', Auth.middlewares.session);
    app.get('/me', Auth.middlewares.session);
    app.all('/api*', Auth.middlewares.session);

    app.get('/api/question', Question.get);
    app.get('/api/question/:id', Question.get);

    app.post('/api/question', Question.create);

    // fileserver
    app.use(express.static(`${__dirname}/work`));
};
