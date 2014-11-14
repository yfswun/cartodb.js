var FakeConsole = function FakeConsole() {};
FakeConsole.prototype.error = function() {};
FakeConsole.prototype.log = function() {};

//IE7 love
if(typeof console !== "undefined") {
  _console = console;
  try {
    _console.log.apply(_console, ['cartodb.js ' + cartodb.VERSION])
  } catch(e) {
    _console = new FakeConsole();
  }
} else {
  _console = new FakeConsole();
}

module.exports = _console;
