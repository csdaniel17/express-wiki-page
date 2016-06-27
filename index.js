var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var fsAccess = require('fs-access');
var wikiLinkify = require('wiki-linkify');
var marked = require('marked');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');

app.get('/', function(request, response) {
  response.redirect('/HomePage');
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

app.get('/AllPages', function(request, response) {
  var pageName = request.params.pageName;
  var filename = 'pages/' + pageName + '.md';
  fs.readFile(filename, function(err, data) {
    if (err) {
      console.log('error on all pages file');
      response.statusCode = 500;
      response.send('Sorry, problem reading the file.');
      return;
    }
    var content = buffer.toString();
    response.render('allpages.hbs', {
      title: pageName,
      content: content
    });
  });
});

app.get('/:pageName/edit', function(request, response) {
  var pageName = request.params.pageName;
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
