var logger = require("./logger")
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var db;
var collections = {};

exports.connect = function (url, callback)
{
    db = mongoose.createConnection(url);
    db.on("connected",function (err){ logger.log("connected to db " + url); callback("connected",err)});
    db.on("error",function (err){ logger.log( url + " error: " + err,"error"); callback("error",err)}); 
    db.on("disconnected",function (err){ logger.log(url + " disconnected"); callback("disconnected",err)}); 
}

exports.createCollection = function(name, schema, indexes)
{
    var schemaobj =  new Schema(schema);
    if (indexes)
    {
        schemaobj.index(indexes);
    }
    var collection = db.model(name, schemaobj);

    collections[name] = collection;

    logger.log("create collection " + name);
    return collection;
}


exports.getCollection = function (name)
{
    return collections[name];
}
