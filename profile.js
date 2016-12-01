var fs=require('fs');  
var logger = require('./core/logger')

module.exports = (function()
{
    try
    {
        var config = JSON.parse(fs.readFileSync('config.json'));
        console.log("profile:")

        for (var i in config)
        {
            console.log("   " + i + " = " + config[i])
        }
        
        return config;
    }
    catch(e)
    {
        logger.log(e,"error")
        logger.log("cannot read config.json.","warn")

        return {};
    }
})()