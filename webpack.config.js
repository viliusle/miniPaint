var webpack = require('webpack');
var path = require('path');
var WebpackPwaManifest = require('webpack-pwa-manifest');

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
		new WebpackPwaManifest({
			name: "miniPaint",
			short_name: "miniPaint",
			description: "miniPaint is free online image editor using HTML5.",
			start_url: "/",
			display: "standalone",
			orientation: "landscape",
			publicPath: './',
			background_color: "#666d6f",
			filename: "manifest.json",
			includeDirectory: true,
			icons: [
				{
					src: path.resolve("images/manifest/48x48.png"),
					sizes: "48x48",
					type: "image/png"
				},
				{
					src: path.resolve("images/manifest/72x72.png"),
					sizes: "72x72",
					type: "image/png"
				},
				{
					src: path.resolve("images/manifest/96x96.png"),
					sizes: "96x96",
					type: "image/png"
				},
				{
					src: path.resolve("images/manifest/144x144.png"),
					sizes: "144x144",
					type: "image/png"
				},
				{
					src: path.resolve("images/manifest/168x168.png"),
					size: "168x168",
					type: "image/png"
				},
				{
					src: path.resolve("images/manifest/192x192.png"),
					sizes: "192x192",
					type: "image/png"
				}
			]
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