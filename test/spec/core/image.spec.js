describe("Image", function() {

  var layers = {};

  beforeEach(function() {
    var img = $('<img id="image" />');
    $("body").append(img);

    this._generateTestStaticImage = function(json) {

      StaticImage.prototype._requestLayerGroupID = function() {

        //this.imageOptions.layergroupid = data.layergroupid;
        //this.cdn_url = data.cdn_url;

        this.queue.flush(this);
      };

      StaticImage.prototype.load = function(vizjson, options) {

        this.queue = new Queue;
        this.no_cdn = options.no_cdn;
        this.userOptions = options;

        options = _.defaults({ vizjson: vizjson, temp_id: "s" + this._getUUID() }, this.defaults);

        this.imageOptions = options;

        this._onVisLoaded(json); 

      };

    };

    layers.cartodb = {
      id: "5fcf9b4c-9d54-4458-b8b0-9a38c0791e8d",
      parent_id: null,
      children: [],
      type: "CartoDB",
      infowindow: {
        fields: [{
          name: "date",
          title: true,
          position: 1
        },
        {
          name: "day",
          title: true,
          position: 2
        }
        ],
        template_name: "table/views/infowindow_light",
        template: "template",
        alternative_names: {},
        width: 226,
        maxHeight: 180
      },
      tooltip: null,
      legend: null,
      order: 1,
      visible: true,
      options: {
        sql: "select * from crashes_2007_2009_intensity",
        layer_name: "crashes_2007_2009_intensity",
        cartocss: "cartocss",
        cartocss_version: "2.1.1",
        interactivity: "cartodb_id",
        table_name: "\"\".",
        dynamic_cdn: false
      }};

      layers.tiled  = {
      options:{
        visible:true,
        type:"Tiled",
        urlTemplate:"http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        subdomains:"1234",
        name:"Positron",
        className:"positron_rainbow",
        attribution: "attribution"
      },
      infowindow:null,
      tooltip:null,
      id:"12345",
      order:0,
      parent_id:null,
      children:[],
      type:"tiled"
    };

    layers.namedmap = {
      type:"namedmap",
      order:1,
      options:{
        type:"namedmap",
        user_name:"documentation",
        tiler_protocol:"https",
        tiler_domain:"cartodb.com",
        tiler_port:"443",
        cdn_url:{
          http:"api.cartocdn.com",
          https:"cartocdn.global.ssl.fastly.net"
        },
        dynamic_cdn:false,
        named_map:{
          name:"tpl_1234567889X",
          stat_tag: "123456789X",
          params:{
            layer0:1
          },
          layers:[
            {
            layer_name:"untitled_table_5",
            interactivity:"cartodb_id",
            visible:true
          }
          ]
        }
      }
    };

    this._getDefaultJSON = function(layers) {

      return {
        id: "123456789X",
        version:"0.1.0",
        title: "title",
        likes:0,
        description:null,
        scrollwheel: false,
        legends: true,
        url: null,
        map_provider: "leaflet",
        bounds:[
          [0.0, 0.0],
          [0.0, 0.0]
        ],
        center: "[30, 0]",
        zoom: 3,
        updated_at:"2015-03-31T08:21:18+00:00",
        layers: layers,
        overlays: null,
        prev:null,
        next:null,
        transition_options:{
          time:0
        },
        auth_tokens:[
          "my_auth_token"
        ]
      }
    };
  });

  afterEach(function() {
    $("#image").remove();
  });

  it("should allow to set the size", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(640, 480);

    image.getUrl(function() {
      expect(image.imageOptions["size"]).toEqual([640, 480]);
      done();
    });

  });

  it("should use the basemap defined in the vizjson", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/318ab654-c989-11e4-97c6-0e9d821ea90d/viz.json"

    var image = cartodb.Image(vizjson).size(640, 480);

    var basemap = { options: { visible: true, type: 'Tiled', urlTemplate: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24', subdomains: '1234', name: 'Nokia Day', className: 'nokia_day', attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>" }, infowindow: null, tooltip: null, id: '2c4a8c5e-2ba5-4068-8807-d916a01b48d5', order: 0, parent_id: null, children: [  ], type: 'tiled' }

    image.getUrl(function() {
      expect(image.imageOptions.basemap).toEqual(basemap);
      done();
    });

  });

  it("should generate the URL for a torque layer", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/3ec995a8-b6ae-11e4-849e-0e4fddd5de28/viz.json"

    var image = cartodb.Image(vizjson);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-138\.6474609375,27\.761329874505233,-83\.408203125,51\.26191485308451/320/240\.pn");

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("torque");
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the right layer configuration for a torque layer and a named map", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/e7b04b62-b901-11e4-b0d7-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("named");
      done();
    });

  });

  it("should generate the right layer configuration for a torque layer with a named map inside", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/6b447f26-c80b-11e4-8164-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("named");
      done();
    });

  });

  it("should allow to use a step for a torque layer", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/3ec995a8-b6ae-11e4-849e-0e4fddd5de28/viz.json"

    var image = cartodb.Image(vizjson, { step: 10 });

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-138\.6474609375,27\.761329874505233,-83\.408203125,51\.26191485308451/320/240\.pn");

    image.getUrl(function(err, url) {
      expect(image.options.userOptions.step).toEqual(10);
      expect(image.options.layers.layers[1].options.step).toEqual(10);
      done();
    });

  });

  it("shouldn't use hidden layers to generate the image", function(done) { 

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/42e98b9a-bcce-11e4-9d68-0e9d821ea90d/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      done();
    });

  });

  it("should extract the cdn_url from the vizjson", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/e7b04b62-b901-11e4-b0d7-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.cdn_url.http).toEqual("ashbu.cartocdn.com");
      expect(image.options.cdn_url.https).toEqual("cartocdn-ashbu.global.ssl.fastly.net");
      done();
    });

  });

  it("should allow to set the zoom", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).zoom(4);

    image.getUrl(function() {
      expect(image.imageOptions["zoom"]).toEqual(4);
      done();
    });

  });

  it("should allow to set the center", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).center([40, 30]);

    image.getUrl(function() {
      expect(image.imageOptions["center"]).toEqual([40, 30]);
      done();
    });

  });

  it("should allow to set the bounding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-31\.05,-155\.74,82\.58,261\.21/400/300\.png");

    cartodb.Image(vizjson).bbox([-31.05, -155.74, 82.58, 261.21]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should allow to override the bounding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/52\.5897007687178/52\.734375/400/300\.png");

    cartodb.Image(vizjson, { override_bbox: true }).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("shouldn't generate a bbox URL without a bouding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/52\.5897007687178/52\.734375/400/300\.png");

    cartodb.Image(vizjson).bbox([]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should use the zoom defined in the vizjson", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/2/40/10/320/240\.png");

    image.center([40,10]).getUrl(function(err, url) {
      expect(image.imageOptions.zoom).toEqual(2);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should allow to set the format", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("jpg");

    image.getUrl(function() {
      expect(image.imageOptions["format"]).toEqual("jpg");
      done();
    });

  });

  it("shouldn't allow to set an invalid format", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("pin");

    image.getUrl(function() {
      expect(image.imageOptions["format"]).toEqual("png");
      done();
    });

  });

  it("should generate the image URL", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)320/240\.png");

    cartodb.Image(vizjson).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image URL using custom params", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image inside of an image element", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var img = document.getElementById('image');

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).into(img);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    setTimeout(function() {
      expect($("#image").attr("src")).toMatch(regexp);
      done();
    }, 800);

  });

  it("should generate an image using a layer definition", function(done) {

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "cartodb.com",
      tiler_port: "80",
      tiler_protocol: "http",
      layers: [{
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
          subdomains: [ "a", "b", "c" ]
        }
      }, {
        type: "cartodb",
        options: {
          sql: "SELECT * FROM nyc_wifi",
          cartocss: "#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }",
          cartocss_version: "2.1.1"
        }
      }]
    };

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/2/0/0/250/250\.png");

    cartodb.Image(layer_definition).size(250, 250).zoom(2).getUrl(function(error, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate an image using a layer definition in a certain bbox", function(done) {

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "cartodb.com",
      tiler_port: "80",
      tiler_protocol: "http",
      layers: [{
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
          subdomains: [ "a", "b", "c" ]
        }
      }, {
        type: "cartodb",
        options: {
          sql: "SELECT * FROM nyc_wifi",
          cartocss: "#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }",
          cartocss_version: "2.1.1"
        }
      }]
    };

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/8c67df0046ce227a89a65d0e3f87e80e:1398886221740.03/-87.82814025878906,41.88719899247721,-27.5936508178711,41.942765696654604/250/250\.png");

    cartodb.Image(layer_definition).size(250, 250).bbox([[-87.82814025878906,41.88719899247721], [ -27.5936508178711,41.942765696654604]]).getUrl(function(error, url) {
      expect(url.match(regexp).length).toEqual(1);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should use maps_api_template when provided", function() {

    var layer_definition = {
      user_name: "documentation",
      maps_api_template: 'http://cartodb.com/user/{user}/api/v1/maps',
      tiler_domain: "cartodb.com",
      tiler_port: "80",
      tiler_protocol: "http",
      layers: [{
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
          subdomains: [ "a", "b", "c" ]
        }
      }, {
        type: "cartodb",
        options: {
          sql: "SELECT * FROM nyc_wifi",
          cartocss: "#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }",
          cartocss_version: "2.1.1"
        }
      }]
    };

    expect(cartodb.Image(layer_definition)._tilerHost()).toEqual(
      'http://cartodb.com/user/documentation/api/v1/maps'
    )

  });

  it("should generate an image using a layer definition for a plain color", function(done) {

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "cartodb.com",
      tiler_port: "80",
      tiler_protocol: "http",
      layers: [{
        type: "plain",
        options: {
          color: "lightblue"
        }
      }, {
        type: "cartodb",
        options: {
          sql: "SELECT * FROM nyc_wifi",
          cartocss: "#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }",
          cartocss_version: "2.1.1"
        }
      }]
    };

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/2/0/0/250/250\.png");

    cartodb.Image(layer_definition).size(250, 250).zoom(2).getUrl(function(error, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (https)", function(done) {

    var vizjson = "https://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    var regexp = new RegExp("https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (http)", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (http, no_cdn)", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson, { no_cdn: true }).size(400, 300);

    var regexp = new RegExp("http://documentation.cartodb.com:80/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("shouldn't send the urlTemplate if the vizjson doesn't contain it", function(done) {

    var vizjson = "https://documentation.cartodb.com/api/v2/viz/75b90cd6-e9cf-11e2-8be0-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(1);
      expect(image.options.layers.layers[0].type).toEqual("cartodb");
      done();
    });

  });

  it("should send the auth_tokens", function(done) {

    var vizjson = "http://url/api/v2/viz/123456789X/viz.json"
    var l = [layers.tiled, layers.named_map];
    var json = this._getDefaultJSON(l);
    json.auth_tokens = ["my_auth_token"];

    this._generateTestStaticImage(json);

    var image = cartodb.Image(vizjson).size(400, 300);

    image.getUrl(function(err, url) {
      debugger;
      expect(image.options.layers.layers[1].options.auth_tokens.length > 0).toBe(true);
      expect(image.options.layers.layers[1].options.auth_tokens[0]).toBe("my_auth_token");
      done();
    });

  });

});
