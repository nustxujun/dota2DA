var schedule = require('node-schedule');
var http = require('http')
var datamgr = require("./datamgr.js")
var dota2api = require("../libs/dota2api")
var logger = require("../libs/logger")

var interval = 10;

var itemsummaries
var itemdetails
var matchdetails
var cache
var herosummaries


function getTime()
{
    return (new Date()).getTime();
}

function getTimestamp(duration)
{
    return  Math.floor(duration / interval) * interval;
}

function errorlog(err) 
{ 
    if (err) 
        logger.log(err,"error") 
    else 
        return true; 
};




function push(data)
{
    var games = data.result.games;
    if (!games)
        return;
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
                    logger.log(err,"error");
                else
                    cache.add(doc.matchid)
            })
    }
}

function collect()
{
    dota2api.GetLiveLeagueGames(function (data, err)
    {
        if (errorlog(err) && data.result)
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
            itemdetails.update({itemid:item, heroid:p.hero_id, timestamp : timestamp }, {$inc:inc},{upsert: true},errorlog);
        }
    }

    summaries.forEach(function (item, key)
    {
        itemsummaries.update({itemid:item.item, heroid:item.hero},{$inc:{used:1, win: item.win}}, {upsert:true},errorlog)
    })
}

function process(matchid, timestamp)
{
    if (getTime() - timestamp < 600000) //process after end of matches in ten min
        return;
        console.log("process")
    dota2api.GetMatchDetails(matchid, function(data,err)
    {
        if (err || data.result.error == "Match ID not found") 
        {
            errorlog(err);
            // delay
            cache.add(matchid)
            return;
        }
        cache.delete(matchid);

        // cm only
        if (data.result.game_mode != 2)
        {
            logger.log("match " + matchid + " game mode is " + data.result.game_mode + ", MUST BE CM mode!");
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
            herosummaries.update({heroid: p.hero_id}, {$inc:inc}, {upsert:true}, errorlog)
        }

        matchdetails.find({matchid:matchid}, function (err, docs)
        {
            if (!errorlog(err))
                return;

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
    return true;// break the forEach loop;
}

exports.start = function ()
{
    datamgr.init();
    itemsummaries = datamgr.getItemSummaries();
    itemdetails = datamgr.getItemDetails()
    matchdetails = datamgr.getMatchDetails()
    herosummaries = datamgr.getHeroSummaries();

    cache = datamgr.getCaches();
    cache.add = function (id)
    {
        cache.update({matchid:id}, {$set:{timestamp:getTime()}},{upsert:true},function (err, doc)
        {
            errorlog(err)
            //if (errorlog(err) && doc)
            //    logger.log("add match " + id + " to caches");
        })
    }

    cache.delete = function (id)
    {
        cache.remove({matchid:id}, function (err)
        {
            if (errorlog(err))
                logger.log("remove match " + id + " from cache")
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



    var seconds = [];
    for (var i = 0; i < 60 ; i += interval)
        seconds.push(i);

    var rule = new schedule.RecurrenceRule();
    rule.second = seconds;
    var timer = schedule.scheduleJob(rule, function()
    {
        collect();
        cache.forEach(process)
    });

}