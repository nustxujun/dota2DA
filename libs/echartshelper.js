

var echartshelper = function (chart, option)
{
    if (!option)
    {
        option = {
            animation:false,
            tooltip: {
                trigger: 'axis',
                formatter: '{b}',
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
            yAxis: {
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
            legend: {
                data:[],
            },
            series:[],
        };
    }

    var helper = 
    {
        chart:chart,
        series:{},
        option:option,
        colors : ['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'],  

        getOptions: function()
        {
            return this.option;
        },

        update: function(name, line)
        {
            var color = this.colors.shift();
            
            if (!line.lineStyle)
                line.lineStyle = {normal:{color:color}};

            if (line.markLine && !line.markLine.lineStyle)
                line.markLine.lineStyle = {normal:{color:color}};

            this.series[name] = line;
        },

        remove: function(name)
        {
            this.color.unshift(this.series[name].lineStyle.normal.color)
            this.series[name] = null;
        },

        refresh : function()
        {
            var series = [];
            var legend = [];
            for(var i in this.series)
            {
                var line = this.series[i]
                series.push(line);
                legend.push({name:line.name, icon:'none',textStyle:{color:line.lineStyle.normal.color}});
            }

            this.option.series = series;
            this.option.legend.data = legend;

            this.chart.setOption(this.option);
            this.chart.resize();
        },   

    }
    return helper;
}
