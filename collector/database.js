var logger = require("../libs/logger")

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var db;
var collections = {};

exports.connect = function (url)
{
    db = mongoose.createConnection(url);
    db.on("connected",function (){ logger.log("connected to db " + url)});
    db.on("error",function (err){ logger.log( url + " error: " + err,"error");}); 
    db.on("disconnected",function (){ logger.log(url + " disconnected");}); 
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
