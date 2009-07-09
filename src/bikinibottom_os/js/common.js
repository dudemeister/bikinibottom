// Avoid breaking browsers with console.logs
if (!window.console) {
  var console = {
    log: function() {}
  };
}