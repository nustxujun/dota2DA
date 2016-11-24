var http = require('http')
var logger = require("./logger")
var schedule = require('node-schedule');
var interval = 1;



var interfacesMap = 
{
    GetHeroes: "IEconDOTA2_570",
    GetLiveLeagueGames:"IDOTA2Match_570",
    GetMatchDetails:"IDOTA2Match_570",
    GetGameItems:"IEconDOTA2_570",
}


var requestList = new Array();

function call(method, args, callback)
{
    //requestList.push({method: method, args: args, callback: callback});
    callImpl(method, args, callback);
}

function callImpl(method, args, callback)
{
    var paras = "";
    for (var key in args) 
    {
        paras += "&" + key + "=" + args[key];
    }

    if (typeof(interfacesMap[method]) == "undefined" )
    {
        logger.log("cannot find interface for " + method,"error");
        return;
    }

    var url = "http://api.steampowered.com/" + 
                interfacesMap[method] + "/" +
                method +
                "/v001/?key=C482D5B27FD23B5F10F38096D15E8995" + 
                paras;
    

    

    //logger.log("call " + url);
    var req = http.get(url, function (response)
    {
        var data = "";
        response.on("data", function(chunk)
        {
            data += chunk;
        }).on("end",function()
        {
            if (response.statusCode != 200)
            {
                logger.log("return code: " + response.statusCode,"error");
                logger.log(data,"error");

                callback(data, response.statusCode);
            }
            else
            {
                
                try{
                    var result = JSON.parse(data);
                    callback(result);
                }
                catch(e)
                {
                    
                    //logger.log("failed to parse json data, in dota2api", "error");
					logger.log("failed to get response " + url,"error");
					callback(data,"fail to parse json data");
                }
            }
            clearTimeout( timeout );
        }).on("error", function (err)
        {
            logger.log("failed to get response " + url,"error");
            //logger.log(err,"error");
            clearTimeout( timeout );
            callback(data,err)
        })
    })

    req.on("error", function (err)
        {
            logger.log("failed to call " + url,"error");
            logger.log(err,"error");
            clearTimeout( timeout );
        })

    var timeout = setTimeout( function ()
    {
        logger.log("request " + url + " is timeout")
        req.abort();
        callback({},"timeout");
    },120000)
    //req.end();
}

function process()
{

    if (requestList.length != 0)
    {   
        var obj = requestList.shift();
        callImpl(obj.method, obj.args, obj.callback);
    }
}

var seconds = [];
for (var i = 0; i < 60; i += interval)
{
    seconds.push(i);
}

var rule = new schedule.RecurrenceRule();
rule.second = seconds;

var timer = schedule.scheduleJob(rule, function()
{
    for (var i = 0; i < 5; ++i)
        process();

    if (requestList.length > 10)
        logger.log("msg in queue: " + requestList.length)
});


exports.call = call;

exports.GetHeroes = function(callback)
{
    call("GetHeroes",{}, callback);
}

exports.GetLiveLeagueGames = function(callback)
{
    call("GetLiveLeagueGames", {}, callback)
}

exports.GetMatchDetails = function(matchid, callback)
{
    call( "GetMatchDetails", {match_id:matchid}, callback)
}

exports.GetGameItems = function(callback)
{
    call("GetGameItems",{}, callback);
}
