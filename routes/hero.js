var express = require('express');
var router = express.Router();

router.get(/.*/, function(req, res, next) {
    var heroname = req.path.substr(1);
    var args = req.qurey;
    console.log(req.originalUrl)
    //res.render('hero');
    res.send("ok")
});

module.exports = router;
