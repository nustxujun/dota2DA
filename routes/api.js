var express = require('express');
var router = express.Router();
var dota2api = require('../libs/dota2api')
var datamgr = require("../collector/datamgr.js")
var logger = require("../libs/logger")

var heroes;
var heroMap = {};
var heroNameMap = {};
var items;
var itemMap = {};
var itemNameMap = {};
dota2api.GetHeroes(function (data)
{
    heroes = data.result.heroes;
    for (var i in heroes)
    {
        var h = heroes[i];
        var name = h.name.match(/npc_dota_hero_(.*)/)[1];
        heroMap[name] = h.id;
        heroNameMap[h.id]= name;
    }

    logger.log("load hero list completed.")
})

dota2api.GetGameItems(function (data)
{
    items = data.result.items;
    for (var i in items)
    {
        var h = items[i];
        var name = h.name.match(/item_(.*)/)[1];
        itemMap[name] = h.id;
        itemNameMap[h.id] = (name);

    }

    logger.log("load item list completed.")
})

router.get("/GetHeroes", function(req, res, next) {
    res.send(heroes);
});

router.get("/GetItems", function(req, res, next) {
    res.send(items);
});

router.get("/GetItemSummaries", function(req, res, next) {
    var itemsummaries = datamgr.getItemSummaries();
    
    itemsummaries.find({heroid: heroMap[req.query.name]}, null, {sort:{used: -1}},function (err, docs)
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
                ret.push({item:itemNameMap[d.itemid], hero: heroNameMap[d.heroid], used: d.used, win: d.win})
            }
            res.send(ret);
        }
    })
});

router.get("/GetHeroSummaries", function(req, res, next) {
    var herosummaries = datamgr.getHeroSummaries();
    
    herosummaries.findOne({heroid: heroMap[req.query.name]},function (err, doc)
    {
        if (err)
        {
            logger.log(err, "error")
        }
        else
        {
            res.send(doc);
        }
    })
});

router.get("/GetHeroDetails", function(req, res, next) {
    var herodetails = datamgr.getHeroDetails();
    
    herodetails.find({heroid: heroMap[req.query.name]},function (err, docs)
    {
        if (err)
            logger.log(err, "error")
        else
        {
            res.send(docs)
        }
    })
});

router.get("/GetItemDetails", function(req, res, next) {

    if (!req.query.item || !req.query.hero )
    {
        res.send("args err");
        return;
    }

    var itemdetails = datamgr.getItemDetails();
    var condition = {};
    condition.itemid = itemMap[req.query.item];
    condition.heroid = heroMap[req.query.hero];
    itemdetails.find(condition,null, {sort:{timestamp:1}},function (err, docs)
    {
        if (err)
            logger.log(err, "error")
        else
        {
            var ret = [];
            for (var i in docs)
            {
                var d = docs[i];

                ret.push({item:itemNameMap[d.itemid], hero:heroNameMap[d.heroid], used: d.used, win: d.win, timestamp:d.timestamp})
            }
            res.send(ret);
        }
    })
});





module.exports = router;
