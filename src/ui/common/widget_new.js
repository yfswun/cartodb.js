var Histogram = cdb.core.View.extend({

  events: {
    //'click .js-clear': '_reset'
  },

  initialize: function() {
    _.bindAll(this, '_adjustBrushHandles', '_reset');

    $(".js-clear").on("click", this._reset);
    this.model = new cdb.core.Model();
    this._getData();
    this.render();
  },

  render: function() {
    this._setupDimensions();
    this._generateChart();
    this._generateHorizontalLines();
    this._generateBars(this.width, this.height);
    this._generateHandles();
    this._setupBrush();
    this._addXAxis();
  },

  _setupDimensions: function() {
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
    this.barWidth    = width / data.length;
  },

  _generateChart: function() {
    this.chart = d3.select(this.options.className)
    .attr('width',  this.chartWidth)
    .attr('height', this.chartHeight)
    .append('g')
    .attr('transform', 'translate(10, 0)');
  },

  _setupBrush: function() {
    var self = this;

    var xScale = this.xScale;

    var brush = this.brush = d3.svg.brush().x(this.xScale);

    function brushstart() {
      $(".js-filter").animate({ opacity: 1}, 250);
      self.chart.attr('class', 'selectable');
    }

    function brushend() {

      var data = self.model.get('data');

      if (brush.empty()) {

        $(".js-filter").animate({ opacity: 0 }, 0);

        self.chart.attr('class', 'x');
        self.chart.selectAll('.bar').classed('selected', false);
        d3.select(this).call(brush.extent([0, 0]));

      } else {

        var extent = self.brush.extent();
        var lo = extent[0];
        var hi = extent[1];

        var a = Math.round(self.xScale(lo)/self.barWidth) * (100/data.length);
        var b = Math.round(self.xScale(hi)/self.barWidth) * (100/data.length);

        defaultExtent = [a, b];

        if (!d3.event.sourceEvent) {
          return;
        }

        d3.select(this).transition()
        .duration(brush.empty() ? 0 : 150)
        .call(brush.extent(defaultExtent))
        .call(brush.event);

        self._adjustBrushHandles();

        //self.chart.selectAll('.bar').classed('selected', function(d, i) {
          //var a = Math.ceil(i * self.barWidth);
          //var b = Math.ceil(a + self.barWidth);
          //var LO = Math.ceil(xScale(lo));
          //var HI = Math.ceil(xScale(hi));
          //var isIn = (a > LO && a < HI) || (b > LO && b < HI) || (a <= LO && b >= HI);
          //return !isIn;
        //});
      }
    }

    function brushed() {
      var extent = brush.extent();
      var lo = extent[0];
      var hi = extent[1];

      var sum = 0;
      var p;

      self.chart.selectAll('.bar').classed('selected', function(d, i) {
        var a = Math.ceil(i * self.barWidth);
        var b = Math.ceil(a + self.barWidth);
        var LO = Math.ceil(xScale(lo));
        var HI = Math.ceil(xScale(hi));
        var isIn = (a > LO && a < HI) || (b > LO && b < HI) || (a <= LO && b >= HI);

        if (isIn) {
          sum += d;
        }

        return  !isIn;
      });

      $(".js-val").text(sum);
      self._adjustBrushHandles();
    }

    var data = this.model.get('data');

    this.brush
    .on('brushstart', brushstart)
    .on('brush', brushed)
    .on('brushend', brushend);


    var self = this;
    this.chart.append('g')
    .attr('class', 'brush')
    .call(this.brush)
    .selectAll('rect')
    .attr('y', 0)
    .attr('height', this.height)
    /*
    .on('mouseenter', function(d) {		
      $(".tooltip").stop().fadeIn(250);
    })
    .on('mouseout', function(d) {		
      d3.selectAll('.bar').classed('is-highlighted', false);
      $(".tooltip").hide();
    })
    .on('mousemove', function(d) {		
      var x = d3.event.offsetX - 10;
      var a = Math.ceil(x/self.barWidth) ;
      //console.log(data[a - 1]);

      var bar = d3.select('.bar:nth-child(' + a + ')')
      if (!bar.classed("selected")) {
        var left = (a - 1)*self.barWidth  + 34 + (self.barWidth/2) - ($(".tooltip").width()/2);
        console.log(left, a)
        $(".tooltip").css({ top: self.chartHeight + self.yScale(data[a-1] + 10), left: left });
        $(".tooltip").text(data[a - 1] + " unit");
      } else {
        $(".tooltip").stop().hide();
      }

      d3.selectAll('.bar').classed('is-highlighted', false);
      bar.classed('is-highlighted', true);
    });
    */
  },

  _adjustBrushHandles: function() {

    var extent = this.brush.extent();
    var lo = extent[0];
    var hi = extent[1];

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
      function calculateBins(n) {
        if (n % 2 === 0) return 4;
        else return 4;
      }

      var p = Math.round(data.length / calculateBins(data.length));
      var v = i % p;

      if (v === 0 || i === 0 || i === (data.length - 1)) {
        return _.reduce(data.slice(0, i + 1), function(j, t) {
          return t + j;
        });
      } else {
        return '';
      }
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
    .attr('class', 'y')
    .selectAll('y')
    .data(yData)
    .enter().append('svg:line')
    .attr('class', 'y')
    .attr('x1', 0)
    .attr('y1', function(d) { return d; })
    .attr('x2', this.width)
    .attr('y2', function(d) { return d; });

    this.chart.append('g')
    .attr('class', 'y')
    .selectAll('.x')
    .data(xData)
    .enter().append('svg:line')
    .attr('class', 'x')
    .attr('y1', 0)
    .attr('x1', function(d) { return d; })
    .attr('y2', this.height)
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

    this.tooltip = d3.select('.Widget').append('div')	
    .attr('class', 'tooltip');

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
    .attr('width', this.barWidth - 1);

    bar.transition()
    .ease('elastic')
    .delay(function(d, i) { return Math.random() * (100 + i * 10); })
    .duration(function(d, i) { return 750; })
    .attr('height', function(d) { return d ? self.height - self.yScale(d) : 0; })
    .attr('y', function(d){ return d ? self.yScale(d) : self.height; });
  },

  _getData: function() {
    var data = d3.range(0, 30, 10).map(d3.random.bates(5));

    data = _.map(data, function(d) {
      return Math.round(d  * 100);
    });

    var data = _.map(d3.range(5), function(d) {
      return Math.round(Math.random()) ? 100 : 50;
    });

    this.model.set('data', data);
  },

  _reset: function() {
    var self = this;
    $(".js-filter").animate({ opacity: 0 }, { duration: 250, complete: function() {
      self.brush
      .clear()
      .event(d3.select('.brush'));
      self.chart.attr('class', 'x');
    }});
  }
});

