var express = require('express');
var router = express.Router();
var dota2api = require('../libs/dota2api')
var database = require("../collector/database.js")

var heroes;
var heroMap = {};
var items;
var itemMap = {};
dota2api.GetHeroes(function (data)
{
    heroes = data.result.heroes;
    for (var i in heroes)
    {
        var h = heroes[i];
        var name = h.name.match(/npc_dota_hero_(.*)/)[1];
        heroMap[name] = h.id;
    }
})

dota2api.GetGameItems(function (data)
{
    items = data.result.items;
    for (var i in items)
    {
        var h = items[i];
        var name = h.name.match(/item_(.*)/)[1];
        itemMap[name] = h.id;
    }
})

router.get("/GetHeroes", function(req, res, next) {
    res.send(heroes);
});

router.get("/GetItems", function(req, res, next) {
    res.send(items);
});

router.get("/GetHeroDetails", function(req, res, next) {
    var heroes = database.getCollection("heroes");

    heroes.find({heroid: heroMap[req.query.name]}, null, {sort:{used: -1}},function (err, docs)
    {
        if (err)
        {
            logger.log(err, "error")
        }
        else
        {
            var ret = [];
            for (var i in docs)
            {
                var d = docs[i];
                ret.push({itemid:d.itemid, heroid: d.heroid, used: d.used, win: d.win})
            }
            res.send(ret);
        }
    })
});

router.get("/GetItemDetails", function(req, res, next) {
    var items = database.getCollection("items");

    if (!req.query.item || !req.query.hero )
    {
        res.send("need args")
        return;
    }
    var condition = {};
    condition.itemid = itemMap[req.query.item];
    condition.heroid = heroMap[req.query.hero];

    items.find(condition,null, {sort:{used:-1}},function (err, docs)
    {
        if (err)
        {
            logger.log(err, "error")
        }
        else
        {
            var ret = [];
            for (var i in docs)
            {
                var d = docs[i];
                ret.push({itemid:d.itemid, heroid: d.heroid, used: d.used, win: d.win, timestamp:d.timestamp})
            }
            res.send(ret);
        }
    })
});


module.exports = router;
