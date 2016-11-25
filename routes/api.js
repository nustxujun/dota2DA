var express = require('express');
var router = express.Router();
var dota2api = require('../core/dota2api')
var datamgr = require("../core/datamgr")
var logger = require("../core/logger")

var heroes;
var heroMap = {};
var heroNameMap = {};
var items;
var itemMap = {};
var itemNameMap = {};
var mems = [
    "play",
    "win",
    "gpm",
    "xpm",
    "kills",
    "deaths",
    "assists",
    "lastHits",
    "denies",
    "heroDamage",
    "towerDamage",
    "goldSpent",
    "timestamp",
    "used",
    "netWorth",
    "level",
    "matchid",
    "details",
    "gold",
    "duration"
]

function processResult(data, single) {
    if (!single) {
        var ret = [];
        for (var i in data) {
            var item = data[i]
            ret.push(processResult(item, true));
        }
        return ret;
    }
    else {
        var ret = {};
        if (data.heroid)
            ret.hero = heroNameMap[data.heroid];

        if (data.itemid)
            ret.item = itemNameMap[data.itemid];

        for (var i in mems) {
            var index = mems[i]
            ret[index] = data[index]
        }
        return ret;
    }
}

dota2api.GetHeroes(function (data) {
    heroes = data.result.heroes;
    for (var i in heroes) {
        var h = heroes[i];
        var name = h.name.match(/npc_dota_hero_(.*)/)[1];
        heroMap[name] = h.id;
        heroNameMap[h.id] = name;
    }

    logger.log("load hero list completed.")
})

dota2api.GetGameItems(function (data) {
    items = data.result.items;
    for (var i in items) {
        var h = items[i];
        var name = h.name.match(/item_(.*)/)[1];
        itemMap[name] = h.id;
        itemNameMap[h.id] = (name);

    }

    logger.log("load item list completed.")
})

router.get("/GetHeroes", function (req, res, next) {
    res.send(heroes);
});

router.get("/GetItems", function (req, res, next) {
    res.send(items);
});

router.get("/GetItemSummaries", function (req, res, next) {
    var itemsummaries = datamgr.getItemSummaries();
    var condition = {};
    if (req.query.item)
        condition.itemid = itemMap[req.query.item];
    if (req.query.hero)
        condition.heroid = heroMap[req.query.hero];
    itemsummaries.find(condition, null, { sort: { used: -1 } }, function (err, docs) {
        if (err) {
            logger.log(err, "error")
        }
        else {
            res.send(processResult(docs));
        }
    })
});

router.get("/GetHeroSummaries", function (req, res, next) {
    var herosummaries = datamgr.getHeroSummaries();
    var condition = {};
    condition.heroid = heroMap[req.query.name];
    herosummaries.findOne(condition, function (err, doc) {
        if (err) {
            logger.log(err, "error")
        }
        else {
            if (doc)
                res.send(processResult(doc, true));
        }
    })
});

router.get("/GetHeroDetails", function (req, res, next) {
    var herodetails = datamgr.getHeroDetails();

    herodetails.find({ heroid: heroMap[req.query.name] }, function (err, docs) {
        if (err)
            logger.log(err, "error")
        else {
            res.send(processResult(docs))
        }
    })
});

router.get("/GetItemDetails", function (req, res, next) {

    if (!req.query.item || !req.query.hero) {
        res.send("args err");
        return;
    }

    var itemdetails = datamgr.getItemDetails();
    var condition = {};
    if (req.query.item)
        condition.itemid = itemMap[req.query.item];
    if (req.query.hero)
        condition.heroid = heroMap[req.query.hero];
    itemdetails.find(condition, null, { sort: { timestamp: 1 } }, function (err, docs) {
        if (err)
            logger.log(err, "error")
        else {
            res.send(processResult(docs));
        }
    })
});

router.get("/GetItemVersuses", function (req, res, next) {
    var itemversuses = datamgr.getItemVersuses();
    var condition = {};
    if (req.query.item)
        condition.itemid = itemMap[req.query.item];
    if (req.query.hero)
        condition.heroid = heroMap[req.query.hero];
    itemversuses.find(condition, null, { sort: { used: -1 } }, function (err, docs) {
        if (err) {
            logger.log(err, "error")
        }
        else {
            res.send(processResult(docs));
        }
    })
});




module.exports = router;
