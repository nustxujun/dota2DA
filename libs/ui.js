

var ui = (function ()
{
    var radiobuttons = {};


    return {
        addRadioButton : function (id, group, paras)
        {
            if (!group)
                group = "default";

            var button = document.getElementById(id);
            if (!radiobuttons[group])
                radiobuttons[group] = {};

            var g = radiobuttons[group]
            g[id] = button;
            button.onclick = function ()
            {
                var cur = g["__current"];
                if (!paras.reclick && cur == button)
                    return;
                if (cur)
                    cur.resetcallback(cur, group);
                g["__current"] = undefined;
                if (cur != button)
                {
                    paras.onclick(button,group);
                    if (paras.autoreset)
                        paras.onreset(button,group);
                    else
                        g["__current"] = button;
                }

            }
            button.resetcallback = paras.onreset;
        },

    }

})();