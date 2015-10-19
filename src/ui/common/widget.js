var Histogram = cdb.core.View.extend({

  events: {
    'click .js-clear': '_reset'
  },

  initialize: function() {
    _.bindAll(this, '_adjustBrushHandles');
    this.model = new cdb.core.Model();
    this._getData();
    this.render();
  },

  render: function() {

    var self = this;

    var data = this.model.get('data');

    var margin = { top: 0, right: 10, bottom: 20, left: 10 };
    var width  = this.width  = this.options.width  - margin.left - margin.right;
    var height = this.height = this.options.height - margin.top  - margin.bottom;

    // scale definition
    this.xScale = d3.scale.linear().domain([0, 100]).range([0, width]);
    this.yScale = d3.scale.linear().domain([0, d3.max(data, function(d) { return d; } )]).range([height, 0]);
    this.zScale = d3.scale.ordinal().domain(d3.range(data.length)).rangeRoundBands([0, width]);

    this.chartWidth  = this.width + margin.left + margin.right;
    this.chartHeight = this.height + margin.top + margin.bottom;

    console.log(height, this.chartHeight);

    this.barWidth = width / data.length;

    // chart definition
    this.chart = d3.select(this.options.className)
    .attr('width', this.chartWidth)
    .attr('height', this.chartHeight)
    .append('g')
    .attr('transform', 'translate(10, 0)');

    this._generateHorizontalLines();
    this._generateBars(this.width, this.height);
    this._generateHandles();

    var self = this;
    var xScale = this.xScale;
    var brush = this.brush = d3.svg.brush().x(this.xScale);

    function brushstart() {
      self.chart.attr('class', 'selectable');
    }

    function brushend() {

      var data = self.model.get('data');

      if (brush.empty()) {
        self.chart.attr('class', 'x');
        self.chart.selectAll('.bar').classed('selected', false);
        d3.select(this).call(brush.extent([0, 0]));
      } else {

        var extent = brush.extent();
        var lo = extent[0];
        var hi = extent[1];

        //console.log(Math.round(self.xScale(lo)/self.barWidth));

        var a = Math.round(self.xScale(lo)/self.barWidth) * (100/data.length);
        var b = Math.round(self.xScale(hi)/self.barWidth) * (100/data.length);

        console.log(a, b);

        defaultExtent = [a, b];

        if (!d3.event.sourceEvent) {
          return;
        }

        d3.select(this).transition()
        .duration(brush.empty() ? 150 : 150)
        .call(brush.extent(defaultExtent))
        .call(brush.event);

        self._adjustBrushHandles(lo, hi);

        self.chart.selectAll('.bar').classed('selected', function(d, i) {
          var a = i * this.barWidth;
          var b = a + this.barWidth;
          var isIn = (a > xScale(lo) && a < xScale(hi)) || (b > xScale(lo) && b < xScale(hi)) || (a <= xScale(lo) && b >= xScale(hi));
          return  !isIn;
        });
      }
    }

    function brushed() {
      var extent = brush.extent();
      var extent1;
      var lo = extent[0];
      var hi = extent[1];

      var sum = 0;
      var p;

      self.chart.selectAll('.bar').classed('selected', function(d, i) {
        var a = i * self.barWidth;
        var b = a + self.barWidth;
        var isIn = (a > xScale(lo) && a < xScale(hi)) || (b > xScale(lo) && b < xScale(hi)) || (a <= xScale(lo) && b >= xScale(hi));

        if (isIn) {
          sum += d;
        }

        return  !isIn;
      });

      //console.log(sum);
      self._adjustBrushHandles(lo, hi)

    }

    this.brush
    .on('brushstart', brushstart)
    .on('brush', brushed)
    .on('brushend', brushend)

    this.chart.append('g')
    .attr('class', 'brush')
    .call(this.brush)
    .selectAll('rect')
    .attr('y', 0)
    .attr('height', this.height)
    .on("mousemove", function(d) {		
      console.log(self.yScale(d3.event.offsetX))
    })					
    .on("mouseout", function(d) {		
    });

    this._addXAxis();
  },

  _adjustBrushHandles: function(lo, hi) {
    this.leftHandleLine
    .attr('x1', this.xScale(lo))
    .attr('x2', this.xScale(lo));

    this.rightHandleLine
    .attr('x1', this.xScale(hi))
    .attr('x2', this.xScale(hi));

    this.leftHandle
    .attr('x', this.xScale(lo) - 3);

    this.rightHandle
    .attr('x', this.xScale(hi) - 3);
  },

  _generateHandles: function() {
    this.leftHandleLine  = this.chart.append('line').attr('class', 'l').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', this.height);
    this.rightHandleLine = this.chart.append('line').attr('class', 'l').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', this.height);

    var handle = { width: 6, height: 23, radius: 3 };
    var yPos = (23/2) + (6/2);

    this.leftHandle = this.chart.append('rect')
    .attr('class', 'handle')
    .attr('transform', 'translate(0, ' + yPos + ')')
    .attr('width', handle.width)
    .attr('height', handle.height)
    .attr('rx', handle.radius)
    .attr('ry', handle.radius);

    this.rightHandle = this.chart.append('rect')
    .attr('class', 'handle')
    .attr('transform', 'translate(0, ' + yPos + ')')
    .attr('width', handle.width)
    .attr('height', handle.height)
    .attr('rx', handle.radius)
    .attr('ry', handle.radius);
  },

  _addXAxis: function() {
    var data = this.model.get('data');

    var xAxis = d3.svg.axis()
    .scale(this.zScale)
    .orient('bottom')
    .innerTickSize(0)
    .tickFormat(function(d, i) {
      if (i === Math.ceil((data.length - 1) / 2) || i === data.length - 1 || i === 0) {
        value = _.reduce(data.slice(0, i + 1), function(j, t) {
          return t + j;
        });
      } else {
        value = '';
      }
      return value;
    });

    this.chart.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (this.options.height - 10) + ')')
    .call(xAxis);
  },

  _generateHorizontalLines: function() {

    var yData = d3.range(0, this.height + this.height/2, this.height/2);
    var xData = d3.range(0, this.width + this.width/4, this.width/4);

    this.chart.append('g')
    .attr('class', 'grid y')
    .selectAll('line.y')
    .data(yData)
    .enter().append('svg:line')
    .attr('class', 'y')
    .attr('x1', 0)
    .attr('y1', function(d) { return d; })
    .attr('x2', this.width)
    .attr('y2', function(d) { return d; });

    this.chart.append('g')
    .attr('class', 'grid x')
    .selectAll('.x')
    .data(xData)
    .enter().append('svg:line')
    .attr('class', 'x')
    .attr('y1', 0)
    .attr('x1', function(d) { return d; })
    .attr('y2', this.width)
    .attr('x2', function(d) { return d; });

    this.bottomLine = this.chart
    .append('line')
    .attr('class', 'l_bottom')
    .attr('x1', 0)
    .attr('y1', this.height)
    .attr('x2', this.width - 1)
    .attr('y2', this.height);
  },

  _generateBars: function(width, height) {
    var self = this;
    var data = this.model.get('data').reverse();

    var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

    var bar = this.chart.append('g')
    .attr('class', 'bars')
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('transform', function(d, i) { return 'translate(' + (i * self.barWidth) + ', 0 )'; })
    .attr('y', function(d) { return self.height; })
    .attr('height', 0)
    .attr('width', this.barWidth - 1)

    bar.transition()
    .ease('elastic')
    .delay(function(d, i) { return Math.random() * (100 + i*10) })
    .duration(function(d, i) { return 750; })
    .attr('height', function(d) { return d ? self.height - self.yScale(d) : 0; })
    .attr('y', function(d){ return d ? self.yScale(d) : self.height; });
  },

  _getData: function() {
    //var data = d3.range(0, 10, 10).map(d3.random.bates(2));

    var data = _.map(d3.range(10), function(d) {
      return Math.round(Math.random()) ? 100 : 50;
    });

    this.model.set('data', data);
  },

  _reset: function() {
    this.brush
    .clear()
    .event(d3.select('.brush'));
    chart.attr('class', 'x');
  }
});

