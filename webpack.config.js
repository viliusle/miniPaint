var webpack = require('webpack');
var path = require('path');

module.exports = {
	entry: [
		'./src/js/main.js',
	],
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js',
		publicPath: '/dist/'
	},
	resolve: {
		extensions: ['.js', '.css'],
		alias: {
			Utilities: path.resolve(__dirname, './../node_modules/')
		}
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: {url: false}
					}
				]
			},
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: ['babel-loader']
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
		// host: '0.0.0.0',
		//contentBase: "./",
		static: {
			directory: path.resolve(__dirname, "./"),
		},
	}
};