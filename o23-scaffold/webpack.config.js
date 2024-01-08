/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

console.log('start build');
module.exports = {
	entry: './src/main',
	devtool: 'source-map',
	target: 'node',
	externals: {},
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: {
					loader: 'ts-loader',
					options: {transpileOnly: true}
				},
				exclude: /node_modules/
			}
		]
	},
	output: {
		clean: true,
		filename: (path) => {
			return path.chunk.name === 'main' ? 'main.js' : 'npm/[name].js'
		},
		path: path.resolve(__dirname, 'dist')
	},
	resolve: {
		extensions: ['.js', '.ts', '.json']
	},
	node: {
		__dirname: false
	},
	plugins: [
		new webpack.IgnorePlugin({
			checkResource(resource) {
				const lazyImports = [
					'@nestjs/microservices',
					'@nestjs/microservices/microservices-module',
					'cache-manager',
					'class-validator',
					'class-transformer'
				];
				if (!lazyImports.includes(resource)) {
					return false;
				}
				try {
					require.resolve(resource, {
						paths: [process.cwd()]
					});
				} catch (err) {
					return true;
				}
				return false;
			}
		}),
		new ForkTsCheckerWebpackPlugin()
	],
	optimization: {
		runtimeChunk: 'single',
		splitChunks: {
			chunks: 'all',
			maxInitialRequests: Infinity,
			minSize: 0,
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name(module) {
						// get name of module
						const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

						// npm package is url safe, but some library don't like "@"
						return `${packageName.replace('@', 'at-')}`;
					}
				}
			}
		}
	}
};
