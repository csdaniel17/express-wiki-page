var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');

app.get('/', function(request, response) {
  response.redirect('/HomePage');
});

app.get('/:pageName', function(request, response) {
  var title = request.params.pageName;
  response.render('placeholder.hbs', {
    title: title
  });
});

app.get('/:pageName/edit', function(request, response) {
  var pageName = request.params.pageName;
  response.render('edit.hbs', {
    title: 'Edit ' + pageName,
    pageName: pageName
  });
});

app.post('/:pageName/save', function(request, response) {
  var pageName = request.params.pageName;
  var content = request.body.content;
  var filename = 'pages/' + pageName + '.txt';
  fs.writeFile(filename, content, function(err) {
    response.redirect('/' + pageName);
  });
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
