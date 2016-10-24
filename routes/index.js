var express = require('express');
var router = express.Router();
var dota2api = require('../libs/dota2api')

/* GET home page. */
router.get('/', function(req, res, next) {

  // dota2api.GetHeroes(function(result)
  // {
  //    var heroes = [];

  //     for (var index in result.result.heroes) 
  //     {
  //       var name = result.result.heroes[index].name.match(/npc_dota_hero_(.*)/)[1];
  //       heroes.push({name:name})
  //     }

  //     res.render('index', {heroes:heroes});
  // })
  
  
  
  
  res.render('index', { title: 'Express' });
});

module.exports = router;
