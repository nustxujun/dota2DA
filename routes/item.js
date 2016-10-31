var express = require('express');
var router = express.Router();

router.get(/.*/, function(req, res, next) {
    var itemname = req.path.substr(1);
    var args = req.qurey;


    res.render('item', {item:itemname});
});

module.exports = router;
