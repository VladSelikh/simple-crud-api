const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: "node",
  entry: {
    app: ["./dist/src/index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./bundle/src"),
    filename: "index.js"
  },
  externals: [nodeExternals()],
  mode: 'production'
};