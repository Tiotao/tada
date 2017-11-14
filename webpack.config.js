var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var path = require('path');

module.exports = {
  devtool: debug ? "inline-sourcemap" : false,
  entry: "./react/src/js/client.js",
  resolveLoader: {
      // An array of directory names to be resolved to the current directory
      modules: ['node_modules', 'node_modules_custom'],
   },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015', 'stage-0'],
          plugins: ['react-html-attrs', 'transform-decorators-legacy', 'transform-class-properties'],
        }
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'public/interface/js'),
    filename: "client.min.js"
  },
  plugins: debug ? [] : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: false,
      output: {
        beautify: false
      },
      compress: {
        warnings: false
      },
      sourcemap: false,
    }),
  ],
};
