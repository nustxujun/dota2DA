var express = require('express');
var router = express.Router();

/* GET libs listing. */
router.get(/.*/, function(req, res, next) {
    res.sendFile(process.cwd() + req.originalUrl );
});

module.exports = router;
