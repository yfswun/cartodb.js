module.exports = function debugCallbacks(o) {
  var callbacks = o._callbacks;
  for(var i in callbacks) {
    var node = callbacks[i];
    console.log(" * ", i);
    var end = node.tail;
    while ((node = node.next) !== end) {
      console.log("    - ", node.context, (node.context && node.context.el) || 'none');
    }
  }
};
