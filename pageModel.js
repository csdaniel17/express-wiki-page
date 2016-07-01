var mongoose = require('mongoose');

var Page = mongoose.model('Page', {
  _id: {type: String, required: true},
  content: {type: String, required: true}
});

module.exports = Page;
