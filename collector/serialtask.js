

var tasks = [];
var waiting = false;
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

var count = 0;
function complete(err)
{
    count--;
    if (count == 0)
	{
        waiting = false;
		setTimeout(function ()
		{
			waiting = false;
			next("from complete");
		}, 1)
	}
}

function next(args)
{
    if (waiting || tasks.length == 0 )
        return;

    for (var i = 0 ; i < 2; ++i)
    {
        var task = tasks.shift();
        if (task)
        {
            waiting = true;
            count++;
            task(complete);
        }
        else
            break;
    }

}