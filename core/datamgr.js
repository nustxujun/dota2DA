var logger = require("./logger")

var itemdetailsSchema = {itemid:Number, heroid:Number, timestamp: Number, used: Number, win:Number}
var itemdetailsIndex = {itemid:1, heroid:1, timestamp:1}
var itemsummariesSchema = {heroid:Number, itemid:Number, used:Number, win: Number};
var itemsummariesIndex = {heroid:1, itemid:1}
var matchdetailsSchema = {matchid: Number, details:String}
var matchdetailsIndex = {matchid:1};
var herosummariesSchema = 
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
}
var herosummariesIndex = {heroid:1};
var herodetailsSchema = 
{
    heroid:Number,
    timestamp:Number,
    play:Number,
    win:Number,
    gpm:Number, 
    xpm:Number, 
    kills:Number, 
    deaths:Number, 
    assists:Number, 
    lastHits:Number,
    denies:Number,
    gold:Number,
    netWorth:Number,
    level: Number,
}
var herodetailsIndex = {heroid:1, timestamp:1}
var cachesSchema = {matchid: Number, timestamp:Number};
var cachesIndex = {matchid:1};
var itemversusesSchema = {itemid:Number, heroid:Number, opponent:Number ,used:Number, win:Number};
var itemversusesIndex = {itemid:1, heroid:1, opponent:1};
var itemversussummariesSchema = {opponentitemid:Number, heroid:Number, used:Number, win:Number};
var itemversussummariesIndex = {opponentitemid:1, heroid:1};
var heroversusesSchema = {heroid:Number, opponent:Number, play:Number, win:Number};
var heroversusesIndex = {heroid:1, opponent:1};
var heropartnersSchema = {heroid:Number, partner:Number, play:Number, win:Number}
var heropartnersIndex = {heroid:1, partner:1};

function onEvent(event, err)
{}

exports.init = function()
{
    var database = require("./database")
    database.connect("mongodb://localhost/test",onEvent);
}

var collections = {};
function getCollection(name, schema, index)
{
    if (collections[name])
        return collections[name];

    var database = require("./database")
    var col = database.createCollection(name, schema, index);
    collections[name] = col;
    return col; 
}

exports.getCaches = function ()
{
    return getCollection("caches", cachesSchema, cachesIndex);
}

exports.getItemDetails = function ()
{
    return getCollection("itemdetails", itemdetailsSchema,itemdetailsIndex);
}

exports.getItemSummaries = function ()
{
    return getCollection("itemsummaries", itemsummariesSchema, itemsummariesIndex);
}

exports.getHeroSummaries = function ()
{
    return getCollection("herosummaries", herosummariesSchema, herosummariesIndex);
}

exports.getHeroDetails = function ()
{
    return getCollection("herodetails", herodetailsSchema, herodetailsIndex);
}

exports.getMatchDetails = function ()
{
    return getCollection("matchdetails", matchdetailsSchema, matchdetailsIndex);
}

exports.getItemVersuses = function()
{
    return getCollection("itemversuses", itemversusesSchema, itemversusesIndex);
}

exports.getHeroVersuses = function()
{
    return getCollection("heroversuses", heroversusesSchema, heroversusesIndex);
}

exports.getItemVersusSummaries = function()
{
    return getCollection("itemversussummaries", itemversussummariesSchema, itemversussummariesIndex);
}

exports.getHeroPartners = function()
{
    return getCollection("heropartners",heropartnersSchema, heropartnersIndex);
}