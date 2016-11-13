var express = require('express');
var router = express.Router();
var dota2api = require('../libs/dota2api')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('heroindex',{page:'hero'});
});

router.get('/heroindex', function(req, res, next) {
  res.render('heroindex',{page:'hero'});
});


router.get('/itemindex', function(req, res, next) {
  res.render('itemindex',{page:'item'});
});


module.exports = router;
