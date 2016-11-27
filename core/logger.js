var log4js = require('log4js')
log4js.configure({
  appenders: [
    { 
        type: 'console',
    }, 
    {
      type: 'file', //文件输出
      filename: 'log.log', 
      backups:3,
      category: 'log' ,
    },
  ]
});

var log = log4js.getLogger('log');

exports.log = function(msg, level)
{
    if (!level || !log[level])
        level = "info"
    log[level](msg);
}

exports.use = function (app)
{
    app.use(log4js.connectLogger(log, {level:'info', format:':method :url'}))
}