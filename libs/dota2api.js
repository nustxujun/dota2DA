var http = require('http')

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
        console.log("cannot find interface for " + method);
        return;
    }

    var url = "http://api.steampowered.com/" + 
                interfacesMap[method] + "/" +
                method +
                "/v001/?key=C482D5B27FD23B5F10F38096D15E8995" + 
                paras;
    
    console.log("call " + url);
    http.get(url, function (response)
    {
        var data = "";
        response.on("data", function(chunk)
        {
            data += chunk;
        }).on("end",function()
        {
            var result = JSON.parse(data);
            console.log("return " + result.result.status);
            
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
    call( "GetLiveLeagueGames", {match_id:matchid}, callback)
}