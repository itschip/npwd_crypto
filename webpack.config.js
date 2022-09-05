const path = require('path');
const webpack = require('webpack');
const { ModuleFederationPlugin } = webpack.container;
const deps = require('./package.json').dependencies;
const HtmlWebpackPlugin = require('html-webpack-plugin');

// HMR
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const isDevelopment = process.env.NODE_ENV === 'development';
const isIngame = process.env.REACT_APP_IN_GAME === '1';

/* TODO: Fix for real */
/* Probably bad way of fixing this */
delete deps['@emotion/react'];
delete deps['@emotion/styled'];
delete deps['@mui/material'];
delete deps['@mui/styles'];



module.exports = {
    entry: './src/bootstrap.ts',
    mode: isDevelopment ? 'development' : 'production',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            getCustomTransformers: () => ({
                                before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean),
                            }),
                            transpileOnly: isDevelopment,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'web/dist'),
        publicPath: 'auto',
        clean: true,
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'npwd_crypto',
            filename: 'remoteEntry.js',
            exposes: {
                './config': './npwd.config',
            },
            remotes: {
                layout: isIngame
                    ? 'layout@https://cfx-nui-npwd/resources/html/remoteEntry.js'
                    : 'layout@http://localhost:3000/remoteEntry.js',
            },
            shared: {
                ...deps,
                react: {
                    singleton: true,
                    requiredVersion: deps.react,
                },
                'react-dom': {
                    singleton: true,
                    requiredVersion: deps['react-dom'],
                }
            },
        }),
        new HtmlWebpackPlugin({
            cache: false,
            template: './src/index.html',
        }),
        new webpack.DefinePlugin({
            process: {env: {REACT_APP_IN_GAME: process.env.REACT_APP_IN_GAME}},
        }),
        isDevelopment && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),

    devServer: {
        port: 3002,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        },
    },
};
