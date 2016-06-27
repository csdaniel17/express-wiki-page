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

app.use(function(request, response, next) {
  console.log('first');
  console.log(request.method + ' ' + request.url);
  fs.appendFile(logFile, request.method + ' ' + request.url + '\n');
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');

app.get('/', function(request, response) {
  response.redirect('/HomePage');
});

app.get('/login', function(request, response) {
  response.render('login.hbs');
});

app.post('/login-submit', function(request, response) {
  var credentials = request.body;
  console.log(credentials);
  if (credentials.username === 'Toby' && credentials.password === 'thepassword') {
    request.session.user = credentials.username;
    response.redirect(request.session.requestUrl);
  } else {
    response.redirect('/login');
  }
});

function authRequired(request, response, next) {
  if(!request.session.user) {
    request.session.requestUrl = request.url;
    response.redirect('/login');
  } else {
    next();
  }
}

app.get('/AllPages', function(request, response) {
  var pageName = request.params.pageName;
  var filename = 'pages/' + pageName + '.md';
  // var filename = 'pages/AllPages.md';
  console.log('filename line 51 is: ', filename);
  fs.readFile(filename, function(err, data) {
    if (err) {
      console.log('error on all pages file');
      response.statusCode = 500;
      response.send('Sorry, problem reading the file.');
      return;
    }
    var content = data.toString();
    console.log('line 59: ', content);
    response.render('allpages.hbs', {
      title: pageName,
      content: content,
      pageName: pageName
    });
  });
});

app.get('/:pageName', function(request, response) {
  var pageName = request.params.pageName;
  var filename = 'pages/' + pageName + '.md';
  console.log(filename);

  fs.access(filename, fs.R_OK, function(err) {
    if (err) {
      //cannot read - render placeholder
      response.render('placeholder.hbs', {
        title: pageName
      });
    } else {
      //read contents and render to page
      fs.readFile(filename, function(err, buffer) {
        if (err) {
          response.statusCode = 500;
          response.send('Sorry, problem reading the file.');
          return;
        }
        var content = buffer.toString();
        var wikiContent = wikiLinkify(content);
        response.render('page.hbs', {
          title: pageName,
          content: marked(wikiContent),
          pageName: pageName
        });
      });
    }
  });
});

app.get('/:pageName/edit', authRequired, function(request, response) {
  //is user logged in? - if no, make sure he's logged in - redirect to log in page
  var pageName = request.params.pageName;
  console.log(pageName);
  var filename = 'pages/' + pageName + '.md';
  fs.readFile(filename, function(err, data) {
    if (err) {
      console.log('error');
      response.render('edit.hbs', {
        title: 'Edit ' + pageName,
        pageName: pageName
      });
      return;
    }
    var content = data.toString();
    response.render('edit.hbs', {
      title: 'Edit ' + pageName,
      pageName: pageName,
      content: content
    });
  });

});

app.post('/:pageName/save', function(request, response) {
  //is user logged in? - if no, make sure he's logged in - redirect to log in page
  var pageName = request.params.pageName;
  var content = request.body.content;
  var filename = 'pages/' + pageName + '.md';
  fs.writeFile(filename, content, function(err) {
    response.redirect('/' + pageName);
  });
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
