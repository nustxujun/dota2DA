var express = require('express');
var router = express.Router();

router.get(/.*/, function(req, res, next) {
    var heroname = req.path.substr(1);
    var args = req.qurey;
    res.render('hero', {hero:heroname});
    //res.send("ok")
});

module.exports = router;
