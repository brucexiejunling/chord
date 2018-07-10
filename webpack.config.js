var path = require('path')
var webpack = require('webpack')
module.exports = {
  entry: {
    'chord': './index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
    chunkFilename: 'chunk/[name].js'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-object-rest-spread', 'transform-object-assign']
        }
      }
    ]
  },
  postcss: function () {
    return [autoprefixer({ browsers: ['Firefox >= 3', 'Opera 12.1', 'Android > 1.5', 'Explorer >= 6', 'iOS >= 5'] }), precss]
  }
}