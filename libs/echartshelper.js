

var echartshelper = function (chart, option)
{
    if (!option)
    {
        option = {
            animation:false,
            tooltip: {
                trigger: 'axis',
                formatter: function (items)
                {
                    for (var i in items)
                    {
                        if (items[i].data )
                        {
                            return items[i].data[0]
                        }
                    }
                },
            },
            grid: {
                left: '0',
                right: '30',
                bottom: '20',
                containLabel: true
            },
            xAxis: {
                name:'T',
                type: 'category',
                boundaryGap : false,
                data: [],
                axisLine:{
                    lineStyle:{
                        color: '#aaa'
                    }
                },
            },
            yAxis: [{
                name:'rate',
                type: 'value',
                min:0,
                max:1,
                splitNumber:2,
                minInterval: 0.5,
                splitLine: {
                    show: true,
                    lineStyle:{
                        color:'#444'
                    }                        
                },
                axisLine:{
                    lineStyle:{
                        color: '#aaa'
                    }
                },
                splitArea:{
                    show:true,
                    areaStyle:{
                        color:['rgba(255,0,0,0.02)','rgba(0,255,0,0.02)']
                    }
                }
            },
            {
                type:'value',
                splitLine:{show:false},
                axisLine:{
                    lineStyle:{
                        color: '#444'
                    }
                },
            }],
            legend: {
                textStyle:{
                    color:"#aaa"
                },
                data:[],
            },
            series:[],
        };
    }

    function filter(data, range)
    {
        var ret = [];

        var size = data.length;
        for (var i = 0; i < size; ++i)
        {
            var value = 0;
            var count = 0;
            for (var j = -range; j <= range; ++j)
            {
                var index = j + i;
                if (index < 0 || index >= size)
                    continue;
                count++;
                var item = data[index];
                if (typeof(item) == "object")
                    value += item[1];
                else    
                    value += item;
            }
            value = value / count;
            
            if (typeof(data[i]) == "object")
                ret.push([data[i][0],value]);
            else
                ret.push(value);
        }
        return ret;
    }

    var helper = 
    {
        chart:chart,
        series:[],
        option:option,
        colors : ['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'],  

        getOptions: function()
        {
            return this.option;
        },

        update: function(line)
        {
            line.data = filter(line.data,2);
            
            for (var i in this.series)
            {
                var l = this.series[i];
                if (l.name == line.name)
                {
                    this.series[i] = line;
                    return;
                }
            }

            this.series.push(line);

        },

        remove: function(name)
        {
            for (var i in this.series) 
            {
                if (this.series[i].name == name)
                {
                    this.series.splice(i, 1);
                    return;
                }
            }
        },

        refresh : function()
        {
            var legend = [];
            for(var i in this.series)
            {
                var line = this.series[i]
                legend.push({name:line.name, icon:'pin'});
            }

            this.option.series = this.series;
            this.option.legend.data = legend;

            this.chart.setOption(this.option,true);
            this.chart.resize();
        },   

    }
    return helper;
}
