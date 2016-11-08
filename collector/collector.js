var schedule = require('node-schedule');
var http = require('http')
var database = require("./database.js")
var dota2api = require("../libs/dota2api")
var logger = require("../libs/logger")

var interval = 10;
var date = new Date();

database.connect("mongodb://localhost/test");
var heroes = database.createCollection("heroes", {heroid:Number, itemid:Number, used:Number, win:Number});
var items = database.createCollection("items", {itemid:Number, heroid:Number, timestamp: Number, used: Number, win:Number})
var matchdetails = database.createCollection("matchdetails", {matchid:Number, duration:Number, details:String});
var cache = database.createCollection("caches", {matchid:Number, timestamp:Number});

function getTime()
{
    return (new Date()).getTime();
}


cache.add = function (id)
{
    cache.update({matchid:id}, {$set:{timestamp:getTime()}},{upsert:true},function (err, data, obj)
    {
        if (err)
            logger.log(err, "error")
    })
}

cache.delete = function (id)
{
    cache.remove({matchid:id}, function (err)
    {
        if (err)
        {
            logger.log("cache.remove", "error");
            logger.log(err, "error")
            return;
        }
        logger.log("remove match " + id )
            
    });   
}

cache.forEach = function (callback)
{
    cache.find({}, function (err, docs)
    {
        for (var i in docs)
        {
            callback(docs[i].matchid, docs[i].timestamp)
        }
    })
}
cache.has = function (){return false;}


//var cache = new Set();

function push(data)
{
    var games = data.result.games;
    for (var index in games)
    {
        var match = games[index];
        var score = match.scoreboard;
        
        if (!score || score.duration == 0 || score.radiant.players.length != 5)
            continue;
        
        
        matchdetails.create({matchid: match.match_id, duration: score.duration, details:JSON.stringify(score)}, 
            function (err, doc)
            {
                if (err)
                {
                    logger.log("matchdetails.create", "error");
                    logger.log(err,"error");
                }
                else
                {
                    cache.add(doc.matchid)
                }
            })
    }
}

function collect()
{
   dota2api.GetLiveLeagueGames(function (data, err)
    {
        if (err) 
        {
            logger.log(err, "error")
            return;
        }
        push(data);            
    })
}

function process()
{
    var index = 0;
    cache.forEach(function(matchid, timestamp)
    {
        index++;
        if (index > 10)
            return;
        if (getTime() - timestamp > 60000) 
        dota2api.GetMatchDetails(matchid, function(data,err)
        {
            if (err || data.result.error == "Match ID not found") 
            {
                if (err)
                    logger.log(err, "error")
                return;
            }
            cache.delete(matchid);

            // cm only
            if (data.result.game_mode != 2)
            {
                return;
            }
            
            logger.log("process match " + matchid);

            var radiantWin = data.result.radiant_win;
            matchdetails.find({matchid:matchid}, function (err, docs)
            {
                if (err)
                {
                    logger.log("matchdetails.find", "error");
                    logger.log(err,"error");
                    return;
                }

                var itemmap = new Map();
                var count = 0;
                for (var d in docs)
                {
                    var doc = docs[d];
                    var score = JSON.parse(doc.details);
                    
                    var timestamp = Math.round(doc.duration / interval) * interval;
                    function parse(players, iswinner, doc, timestamp)
                    {
                        for (var i = 0; i < 5; ++i)
                        {
                            var p = players[i];

                            if (!p)
                            {
                                logger.log("not enough players in match " + matchid + " playerslot: " + i,"warn");
                                break;
                            }
                            for (var j = 0; j < 6; ++j)
                            {
                                var item = p["item" + j];
                                if (item == 0)
                                    continue;

                                function updateitem(item, p)
                                {

                                    
                                    var inc = {used:1, win:0};
                                    if (iswinner)
                                        inc.win = 1;

                                    var val = itemmap.get({heroid:p.hero_id, itemid:item});
                                    if (val)
                                    {
                                        val.used += inc.used;
                                        val.win += inc.win;
                                    }
                                    else
                                        val = inc;
                                    itemmap.set({heroid:p.hero_id, itemid:item}, val);
                                    count++;
                                    items.update({itemid:item, heroid:p.hero_id, timestamp : timestamp }, {$inc:inc},{upsert: true},function (err, doc)
                                    {
                                        if (err)
                                            console.log(err)
                                        if (!doc)
                                            console.log("failed")
                                    });

                                }

                                updateitem(item, p);
                            }
                        }
                    }

                    parse(score.radiant.players, radiantWin, doc, timestamp);
                    parse(score.dire.players, !radiantWin, doc, timestamp);
                    
                }

                console.log("record count " + count)
                

                itemmap.forEach(function (item, key)
                {
                    heroes.update({itemid:key.itemid, heroid:key.heroid}, {$inc:item}, {upsert:true}, function (err, doc)
                    {

                    })

                })

            })


        });
        
    })
}

exports.start = function ()
{
    var seconds = [];
    for (var i = 0; i < 60 ; i += interval)
    {
        seconds.push(i);
    }

    var rule = new schedule.RecurrenceRule();
    rule.second = seconds;

    var timer = schedule.scheduleJob(rule, function()
    {
        collect();
    });

    rule = new schedule.RecurrenceRule();
    rule.sencond = 30;
    var ptimer = schedule.scheduleJob(rule, function()
    {
        process();
    });


}