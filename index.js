var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var fsAccess = require('fs-access');
var wikiLinkify = require('wiki-linkify');
var marked = require('marked');
var session = require('express-session');

var app = express();
var logFile = 'pages/filelog.txt';

app.use(session({
  secret: 'uheosahuhutnesohuntsoe',
  cookie: {
    maxAge: 24 * 3600000
  }
}));

app.use(function(req, res, next) {
  console.log('first');
  console.log(req.method + ' ' + req.url);
  fs.appendFile(logFile, req.method + ' ' + req.url + '\n');
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
  res.redirect('/HomePage');
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
  fs.access(filename, fs.R_OK, function(err) {
    if (err) {
      //cannot read - render placeholder
      res.render('placeholder.hbs', {
        title: pageName
      });
    } else {
      //read contents and render to page
      fs.readFile(filename, function(err, data) {
        if (err) {
          res.statusCode = 500;
          res.send('Sorry, problem reading the file.');
          return;
        }
        var content = data.toString();
        var wikiContent = wikiLinkify(content);
        res.render('page.hbs', {
          title: pageName,
          content: marked(wikiContent),
          pageName: pageName,
          user: user
        });
      });
    }
  });
});

app.get('/:pageName/edit', authRequired, function(req, res) {
  //is user logged in? - if no, make sure he's logged in - redirect to log in page
  var pageName = req.params.pageName;
  console.log(pageName);
  var filename = 'pages/' + pageName + '.md';
  fs.readFile(filename, function(err, data) {
    if (err) {
      console.log('error');
      res.render('edit.hbs', {
        title: 'Edit ' + pageName,
        pageName: pageName
      });
      return;
    }
    var content = data.toString();
    res.render('edit.hbs', {
      title: 'Edit ' + pageName,
      pageName: pageName,
      content: content
    });
  });

});

app.post('/:pageName/save', authRequired, function(req, res) {
  //is user logged in? - if no, make sure he's logged in - redirect to log in page
  var pageName = req.params.pageName;
  var content = req.body.content;
  var filename = 'pages/' + pageName + '.md';
  fs.writeFile(filename, content, function(err) {
    res.redirect('/' + pageName);
  });
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
