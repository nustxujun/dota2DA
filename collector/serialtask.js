

var tasks = [];

exports.add = function (task)
{
    tasks.push(task);
    next();
}

exports.empty = function ()
{
    return tasks.length == 0;
}

exports.size = function()
{
    return tasks.length;
}

function complete(err)
{
    if (tasks.length > 0)
        console.log(tasks.length)
    next();
}

function next()
{
    if (tasks.length == 0)
        return;
    var task = tasks.shift();
    task(complete);
}