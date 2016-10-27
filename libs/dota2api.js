var http = require('http')
var logger = require("./logger")

var interfacesMap = 
{
    GetHeroes: "IEconDOTA2_570",
    GetLiveLeagueGames:"IDOTA2Match_570",
    GetMatchDetails:"IDOTA2Match_570"
}

function call(method, args, callback)
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
    
    logger.log("call " + url);
    http.get(url, function (response)
    {
        var data = "";
        response.on("data", function(chunk)
        {
            data += chunk;
        }).on("end",function()
        {
            var result = JSON.parse(data);
            callback(result);
        })
    })
}

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