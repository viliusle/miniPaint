var webpack = require('webpack');
var path = require('path');

module.exports = {
	entry: [
		'./src/js/main.js',
	],
	output: {
		filename: 'dist/bundle.js',
	},
	resolve: {
		extensions: ['.js', '.css'],
		alias: {
			Utilities: path.resolve(__dirname, './../node_modules/')
		}
	},
	module: {
		loaders: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: {minimize: true, url: false}
					}
				]
			},
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
				loader: 'babel-loader',
					options: {
					presets: ['env']
					}
				}
			},
		]
	},
	plugins: [
		new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
		}),
		new webpack.DefinePlugin({
			VERSION: JSON.stringify(require("./package.json").version)
		}),
	],
	devtool: "cheap-module-source-map",
	devServer: {
		contentBase: "./",
		compress: true,
	}
};