cdb.geo.ui.Header = cdb.core.View.extend({

  className: "cartodb-widget",

  events: { },

  default_options: { },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.template = this.options.template;

  },

  _applyStyle: function() {

    var style      = this.model.get("style");

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});

cdb.geo.ui.Widget = cdb.core.View.extend({

  className: "cartodb-widget",

  events: {
  },

  default_options: {
  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.template = this.options.template;

  },

  _applyStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css({
      left:            this.model.get("x"),
      top:             this.model.get("y"),
      backgroundColor: rgbaCol,
      maxWidth:        boxWidth
    });

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});
