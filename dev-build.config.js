const path = require('path');

module.exports = {
  entry: ['@babel/polyfill', './src/GeoCSSStyleParser.ts'],
  mode: 'development',
  output: {
    filename: 'geoCSSStyleParser.js',
    path: path.join(__dirname, 'browser'),
    library: 'GeoStylerGeoCSSParser'
  },
  resolve: {
    // Add '.ts' as resolvable extensions.
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      // All files with a '.ts'
      {
        test: /\.ts$/,
        include: path.join(__dirname, 'src'),
        use: [
          {
            loader: require.resolve('ts-loader'),
          }
        ]
      }
    ]
  }
};
