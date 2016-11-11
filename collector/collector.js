var schedule = require('node-schedule');
var http = require('http')
var database = require("./database.js")
var dota2api = require("../libs/dota2api")
var logger = require("../libs/logger")

var interval = 10;
var date = new Date();

database.connect("mongodb://localhost/test");
var itemsummaries = database.createCollection("itemsummaries", {heroid:Number, itemid:Number, used:Number, win:Number}, {itemid:1, heroid:1});
var itemdetails = database.createCollection("itemdetails", {itemid:Number, heroid:Number, timestamp: Number, used: Number, win:Number}, {itemid:1, heroid:1, timestamp:1})
var matchdetails = database.createCollection("matchdetails", {matchid:Number, details:String}, {matchid:1});
var cache = database.createCollection("caches", {matchid:Number, timestamp:Number}, {matchid:1});
var herosummaries = database.createCollection("herosummaries", 
    {
        heroid: Number, 
        play:Number, 
        win:Number, 
        gpm:Number, 
        xpm:Number, 
        kills:Number, 
        deaths:Number, 
        assists:Number, 
        lastHits:Number,
        denies:Number,
        heroDamage:Number,
        towerDamage:Number,
        goldSpent:Number,
    }, {heroid:1})


function getTime()
{
    return (new Date()).getTime();
}

function getTimestamp(duration)
{
    return  Math.floor(duration / interval) * interval;
}

function errorLogger(err)
{
    if (err)
        logger.log(err,"error")
}


cache.add = function (id)
{
    cache.update({matchid:id}, {$set:{timestamp:getTime()}},{upsert:true},errorLogger)
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
            if(callback(docs[i].matchid, docs[i].timestamp))
                return ;
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
        
        
        matchdetails.create({matchid: match.match_id,  details:JSON.stringify(score)}, 
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

function checkPlayer(players)
{
    for (var i = 0; i < 10; ++i)
    {
        var p = players[i];

        if (!p || p.hero_id == 0)
        {
            return false;
        }
    }
    return true;
}

function recordItems(players, timestamp, winner, matchid)
{
    var summaries = new Map()
    for (var i = 0; i < 5; ++i)
    {
        var p = players[i];

        for (var j = 0; j < 6; ++j)
        {
            var item = p["item" + j];
            if (item == 0)
                continue;

            var inc = {used:1, win:0};
            inc.win = winner;

            summaries.set(item.toString() + p.hero_id.toString(), {item:item, hero: p.hero_id, win: winner})
            itemdetails.update({itemid:item, heroid:p.hero_id, timestamp : timestamp }, {$inc:inc},{upsert: true},errorLogger);
        }
    }

    summaries.forEach(function (item, key)
    {
        itemsummaries.update({itemid:item.item, heroid:item.hero},{$inc:{used:1, win: item.win}}, {upsert:true},errorLogger)
    })
}

function process()
{
    cache.forEach(function(matchid, timestamp)
    {
        if (getTime() - timestamp > 600000) //process after end of matches in ten min
        {
            dota2api.GetMatchDetails(matchid, function(data,err)
            {
                if (err || data.result.error == "Match ID not found") 
                {
                    if (err)
                        logger.log(err, "error")

                    // delay
                    cache.add(matchid)
                    return;
                }
                cache.delete(matchid);

                // cm only
                if (data.result.game_mode != 2)
                {
                    logger.log("match " + matchid + "game mode is " + data.result.game_mode + ", MUST BE CM mode!");
                    return;
                }
                

                var players = data.result.players
                if (!checkPlayer(players))
                {
                    logger.log("match " + matchid + " has not enough players.")
                    return ;
                }
                
                logger.log("process match " + matchid);

                var radiantWin = data.result.radiant_win;

                for (var i = 0; i < 10 ; ++i)
                {
                    var p = players[i]
                    var inc = 
                    {
                        kills: p.kills,
                        deaths: p.deaths,
                        assists: p.assists,
                        lastHits: p.last_hits,
                        denies: p.denies,
                        gpm:p.gold_per_min,
                        xpm:p.xp_per_min,
                        heroDamage:p.hero_damage,
                        towerDamage: p.tower_damage,
                        goldSpent:p.gold_spent,
                        play:1,
                        win: ((i < 5) && radiantWin)
                    }
                    herosummaries.update({heroid: p.hero_id}, {$inc:inc}, {upsert:true}, errorLogger)
                }

                matchdetails.find({matchid:matchid}, function (err, docs)
                {
                    if (err)
                    {
                        logger.log("matchdetails.find", "error");
                        logger.log(err,"error");
                        return;
                    }

                    for (var d in docs)
                    {
                        var doc = docs[d];
                        var score = JSON.parse(doc.details);
                        var timestamp = getTimestamp(score.duration);

                        recordItems(score.radiant.players, timestamp, radiantWin,matchid);
                        recordItems(score.dire.players, timestamp, !radiantWin,matchid);
                    }

                })

            });
            return true;
        }
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