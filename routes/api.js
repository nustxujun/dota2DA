var express = require('express');
var router = express.Router();
var dota2api = require('../libs/dota2api')

router.get(/.*/, function(req, res, next) {
    
    dota2api.call(req.path.substr(1), req.query, function (result)
    {
        var heroes = [];

        for (var index in result.result.heroes) 
        {
            var name = result.result.heroes[index].name.match(/npc_dota_hero_(.*)/)[1];
            heroes.push({name:name})
        }

        res.send(result);
    })
});

module.exports = router;
