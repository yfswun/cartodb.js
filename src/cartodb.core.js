var Profiler = require('core/profiler.js');
var SQL = require('api/sql.js');
var Tiles = require('api/tiles.js');

global.cdb = global.cartodb = {
  SQL: SQL,
  Tiles: Tiles,

  VERSION: '3.11.24-dev',
  DEBUG: false,

  CARTOCSS_VERSIONS: {
    '2.0.0': '',
    '2.1.0': ''
  },

  CARTOCSS_DEFAULT_VERSION: '2.1.1',

  CDB_HOST: {
    'http': 'api.cartocdn.com',
    'https': 'cartocdn.global.ssl.fastly.net'
  },

  config: {},
  core: {
    Profiler: Profiler
  },
  geo: {
    ui: {},
    geocoder: {}
  },
  ui: {
    common: {}
  },
  vis: {},
  decorators: {}
};
