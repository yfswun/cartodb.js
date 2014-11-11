var makeCRCTable = function() {
  var c;
  var crcTable = [];
  for(var n = 0; n < 256; ++n){
    c = n;
    for(var k = 0; k < 8; ++k){
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
};

var crc32 = function(str, crcTable) {
  var crc = 0 ^ (-1);

  for (var i = 0, l = str.length; i < l; ++i ) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
  }

  return (crc ^ (-1)) >>> 0;
};

var uniqueCallbackName = function(str) {
  var cartodb = global.cartodb || (global.cartodb = {}); // TODO: why should this function know about the global namespace?
  var crcTable = cartodb._crcTable || (cartodb._crcTable = makeCRCTable());
  cartodb._callback_c = cartodb._callback_c || 0;
  ++cartodb._callback_c;
  return crc32(str, crcTable) + "_" + cartodb._callback_c;
};

module.exports = uniqueCallbackName;
