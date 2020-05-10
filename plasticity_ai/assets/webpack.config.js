const path = require('path')

module.exports = {
    output: {
      path: path.resolve(__dirname, 'scripts'),
      publicPath: '/scripts/',
      filename: 'bundle.js',
      
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader"
          }
        }
      ]
    }
  };