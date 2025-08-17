// posthtml.config.js
module.exports = {
  plugins: [
    require('posthtml-include')({
      root: '.' // allows absolute paths like /partials/en/nav-desktop.html
    })
  ]
};
