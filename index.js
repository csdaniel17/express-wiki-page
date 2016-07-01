var express = require('express');
var bodyParser = require('body-parser');
// var fs = require('fs');
var wikiLinkify = require('wiki-linkify');
var marked = require('marked');
var session = require('express-session');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/wiki-db');
var Page = require('./pageModel');

var app = express();
var logFile = 'pages/filelog.txt';

app.use(session({
  secret: 'uheosahuhutnesohuntsoe',
  cookie: {
    maxAge: 24 * 3600000
  }
}));

// app.use(function(req, res, next) {
//   console.log('first');
//   console.log(req.method + ' ' + req.url);
//   fs.appendFile(logFile, req.method + ' ' + req.url + '\n');
//   next();
// });

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
  res.redirect('/HomePage');
});

app.get('/favicon.ico', function(req, res) {
  res.send('');
});

app.get('/login', function(req, res) {
  res.render('login.hbs', {
    title: 'Login'
  });
});

app.get('/logout', function(req, res) {
  req.session.user = null;
  res.redirect('/');
});

app.post('/login-submit', function(req, res) {
  var credentials = req.body;
  console.log(credentials);
  if (credentials.username === 'Toby' && credentials.password === 'thepassword') {
    //use session to remember user
    req.session.user = credentials.username;
    res.redirect(req.session.reqUrl);
  } else {
    res.redirect('/login');
  }
});

function authRequired(req, res, next) {
  if(!req.session.user) {
    req.session.reqUrl = req.url;
    res.redirect('/login');
  } else {
    next();
  }
}

// app.get('/AllPages', function(req, res) {
//   var pageName = req.params.pageName;
//   var filename = 'pages/' + pageName + '.md';
//   // var filename = 'pages/AllPages.md';
//   console.log('filename line 51 is: ', filename);
//   fs.readFile(filename, function(err, data) {
//     if (err) {
//       console.log('error on all pages file');
//       res.statusCode = 500;
//       res.send('Sorry, problem reading the file.');
//       return;
//     }
//     var content = data.toString();
//     console.log('line 59: ', content);
//     res.render('allpages.hbs', {
//       title: pageName,
//       content: content,
//       pageName: pageName
//     });
//   });
// });

app.get('/:pageName', function(req, res) {
  var pageName = req.params.pageName;
  var filename = 'pages/' + pageName + '.md';
  console.log(filename);
  var user = req.session.user;

  Page.findById(pageName, function(err, data) {
    if (!data) {
      console.log('line 103 error');
      res.render('placeholder.hbs', {
        title: pageName
      });
      return;
    } else {
      console.log('line 110: ', data.content);
      var content = data.content;
      var wikiContent = wikiLinkify(content);
      console.log('before render');
      res.render('page.hbs', {
        title: pageName,
        content: marked(wikiContent),
        pageName: pageName,
        user: user
      });
      console.log('after render');
      return;
    }
  });
});

app.get('/:pageName/edit', authRequired, function(req, res) {
  //is user logged in? - if no, make sure he's logged in - redirect to log in page
  var pageName = req.params.pageName;
  console.log(pageName);
  // var filename = 'pages/' + pageName + '.md';

  Page.findById(pageName, function(err, data) {
    if (!data) {
      console.log('line 164 error');
      res.render('edit.hbs', {
        title: 'Edit ' + pageName,
        pageName: pageName
      });
      return;
    } else {
      console.log('line 171: ', data.content);
      var content = data.content;
      var wikiContent = wikiLinkify(content);
      res.render('edit.hbs', {
        title: 'Edit ' + pageName,
        pageName: pageName,
        content: content
      });
      return;
    }
  });
});

app.post('/:pageName/save', authRequired, function(req, res) {
  //is user logged in? - if no, make sure he's logged in - redirect to log in page
  var pageName = req.params.pageName;
  var content = req.body.content;
  var filename = 'pages/' + pageName + '.md';

  Page.update(
    { _id: pageName },
    { content: content },
    { upsert: true },
    function(err, reply) {
      if (err) {
        console.log('line 215 error');
        return;
      }
      console.log('upsert succeeded ', reply);
    }
  );

  res.redirect('/' + pageName);

});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
