
var LegendView = Backbone.View.extend({

  className: 'legend',

  initialize: function() {
    this.model = this.options.model;

    this.model.bind('change', this.render, this);
  },

  render: function() {

    if ($('.legend').length === 0) {
      document.body.appendChild(this.el);
    }

    this.$el.html('');
    var metadataType = this.model.get('type');
    if (metadataType === 'categories') {
      this._renderCategoryLegend();
    } else if (metadataType === 'quartiles') {
      this._renderQuartilesLegend();
    }

    return this;
  },

  _renderCategoryLegend: function() {
    this.$el.html('Categories:');
    var ul = $('<ul>');
    var categories = this.model.get('categories');
    categories.forEach(function(category) {
      var li = $('<li>');
      li.html(category.name + ":" + category.count);
      ul.append(li);
    });
    this.$el.append(ul);
  },

  _renderQuartilesLegend: function() {
    this.$el.html('Quartiles:');
    var ul = $('<ul>');
    var quartiles = this.model.get('quartiles');
    quartiles.forEach(function(quartile) {
      var li = $('<li>');
      li.html(quartile);
      ul.append(li);
    });
    this.$el.append(ul);
  }
})