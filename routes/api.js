var express = require('express');
var router = express.Router();
var dota2api = require('../libs/dota2api')

var heroes;
var items;
dota2api.GetHeroes(function (data)
{
    heroes = data.result.heroes;
})

dota2api.GetGameItems(function (data)
{
    items = data.result.items;
})

router.get("/GetHeroes", function(req, res, next) {
    res.send(heroes);
});

router.get("/GetItems", function(req, res, next) {
    res.send(items);
});

module.exports = router;
