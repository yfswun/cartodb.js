cdb.geo.ui.Title = cdb.core.View.extend({

  className: "cartodb-widget widget-title",

  events: { },

  default_options: { },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.template = this.options.template;

  },

  _applyStyle: function() { },

  render: function() {

    this.$el.html(this.template(this.model.attributes));

    var extra            = this.model.get("extra");

    var show_title       = extra.show_title;
    var show_description = extra.show_description;

    if ( show_title || show_description ) {

      if (show_title)       this.$el.find(".text").show();
      if (show_description) this.$el.find(".description").show();

      this.$el.show();
    }

    this.$text = this.$el.find(".text");
    
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

    var self = this;

    setTimeout(function() {
      self.$el.css({ width: self.$el.width() }) // TODO: calculate width on editing
    }, 250)

  },

  render: function() {

    this.$el.html(this.template(_.extend(this.model.attributes, { text: this.model.attributes.extra.rendered_text })));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});

cdb.geo.ui.Image = cdb.core.View.extend({

  className: "cartodb-widget image-widget",

  events: { },

  default_options: { },

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

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css({
      left:            this.model.get("x"),
      top:             this.model.get("y"),
      backgroundColor: rgbaCol
    });

    this.$el.find("img").css({ width: boxWidth });

  },

  render: function() {

    this.$el.html(this.template(_.extend(this.model.attributes, { text: this.model.attributes.extra.rendered_text })));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});
