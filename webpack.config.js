const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.ts',
    test: './test/test.ts'
  },

  // preferred over eval because 'node-source-map-support' module 
  // expects full source maps
  devtool: 'source-map',  

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};