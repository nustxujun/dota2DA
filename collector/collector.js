var schedule = require('node-schedule');
var http = require('http')
var datamgr = require("../core/datamgr")
var dota2api = require("../core/dota2api")
var logger = require("../core/logger")
var serialtask = require("./serialtask");

var interval = 10;

var itemsummaries
var itemdetails
var matchdetails
var cache
var herosummaries
var herodetails;
var itemversuses;
var itemversussummaries;
var heroversuses;
var heropartners;

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
    {
        logger.log(err,"error") ;
        return false;
    }

    else 
        return true; 
};

var count = 0;
function update(collection, condition,doc, option)
{
    count++;
    serialtask.add(function (callback)
    {
        collection.update(condition, doc, option,callback);
    })
}

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
        // else// retry again
        //     dota2api.GetLiveLeagueGames(function(data,err){
        //         if (errorlog(err) && data.result)
        //             push(data); 
        //     })
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

function record(players, timestamp, winner, matchid, summaries, versuses)
{
    for (var i = 0; i < 5; ++i)
    {
        var p = players[i];
        if (!p || p.hero_id == 0)
            continue;
        versuses[p.hero_id] = {};
        var v = versuses[p.hero_id];
        for (var j = 0; j < 6; ++j)
        {
            var item = p["item" + j];
            if (item == 0)
                continue;

            v[item] = true;

            var inc = {used:1, win:0};
            inc.win = winner;

            summaries.set(item.toString() + p.hero_id.toString(), {item:item, hero: p.hero_id, win: winner})
            update(itemdetails,{itemid:item, heroid:p.hero_id, timestamp : timestamp }, {$inc:inc},{upsert: true})
        }

        var inc = 
        {
            play:1,
            gpm:p.gold_per_min, 
            xpm:p.xp_per_min, 
            kills:p.kills, 
            deaths:p.death, 
            assists:p.assists, 
            lastHits:p.last_hits,
            denies:p.denies,
            gold:p.gold,
            netWorth:p.net_worth,
            level: p.level,
            win:winner,
        }
        update(herodetails,{heroid:p.hero_id, timestamp:timestamp}, {$inc:inc},{upsert:true});
    }
}

function recordVersus(players, win, versuses)
{
    for (var opponent in versuses)
    {
        if (opponent == 0)
            continue;
        var items = versuses[opponent];
        for (var i = 0; i < 5; ++i)
        {
            var p = players[i];
            if (p.hero_id == 0)
                continue;
            for (var item in items)
                update(itemversuses,{heroid:p.hero_id, itemid: item, opponent:opponent}, {$inc:{win:win, used:1}},{upsert: true})
            
            update(heroversuses,{heroid:p.hero_id, opponent:opponent}, {$inc:{play:1, win:win}},{upsert:true})
            update(itemversussummaries,{heroid:p.hero_id, opponentitemid:item}, {$inc:{used:1, win:win}},{upsert:true})
        }
    }
}

function recordPartners(players, win)
{
    for (var i = 0; i < 5; ++i)
    {
        var p = players[i];
        if (p.hero_id == 0)
            continue;
        for (var j = 0; j < 5; ++j)
        {
            var p2 = players[j];
            if (i == j || p.hero_id == 0)
                continue;

            update(heropartners, {heroid:p.hero_id, partner:p2.hero_id}, {$inc:{play:1, win: win}}, {upsert:true})
        }
    }
}

function process(matchid, timestamp)
{
    if (serialtask.size() > 10 ) 
        return;
		
	logger.log("request match " + matchid)	
    cache.add(matchid)
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
                win: ((i < 5) == radiantWin),
            }
            update(herosummaries,{heroid: p.hero_id}, {$inc:inc}, {upsert:true})
        }

        matchdetails.find({matchid:matchid}, function (err, docs)
        {
            if (!errorlog(err) || docs.length == 0)
                return;

            count = 0;
            
            var summaries = new Map()
            var versuses = {radiant:{}, dire:{}};
            for (var d in docs)
            {
                var doc = docs[d];
                var score = JSON.parse(doc.details);
                var timestamp = getTimestamp(score.duration);

                record(score.radiant.players, timestamp, radiantWin,matchid, summaries, versuses.radiant);
                record(score.dire.players, timestamp, !radiantWin,matchid, summaries, versuses.dire);
            }

            recordVersus(score.radiant.players,radiantWin,versuses.dire);
            recordVersus(score.dire.players,!radiantWin,versuses.radiant);
            
            recordPartners(score.radiant.players,radiantWin);
            recordPartners(score.dire.players,!radiantWin);

            summaries.forEach(function (item, key)
            {
                update(itemsummaries,{itemid:item.item, heroid:item.hero},{$inc:{used:1, win: item.win}}, {upsert:true})
            })

            logger.log("data inserted in database: " + count);
            
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
    herodetails = datamgr.getHeroDetails();
    itemversuses = datamgr.getItemVersuses();
    itemversussummaries = datamgr.getItemVersusSummaries();
    heroversuses = datamgr.getHeroVersuses();
    heropartners = datamgr.getHeroPartners();
    
    cache = datamgr.getCaches();
    cache.add = function (id)
    {
        update(cache,{matchid:id}, {$set:{timestamp:getTime()}},{upsert:true});
        
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
        cache.find({timestamp:{$lt:getTime() - 60000 }}, function (err, docs)
        {
            for (var i in docs)
            {
                if(callback(docs[i].matchid, docs[i].timestamp))
                    return ;
            }
        })
    }



    // var seconds = [];
    // for (var i = 0; i < 60 ; i += interval)
    //     seconds.push(i);

    // var rule = new schedule.RecurrenceRule();
    // rule.second = seconds;
    // var timer = schedule.scheduleJob(rule, function()
    // {
    //     collect();
    //     cache.forEach(process)
    // });


    function framemove()
    {
        setTimeout(function()
        {
            collect();
            cache.forEach(process);
            framemove();
        }, 10000)
    }

    framemove();
}