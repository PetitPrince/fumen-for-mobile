const {GenerateSW} = require('workbox-webpack-plugin');

const path = require('path');
const version = process.env.TRAVIS_BUILD_NUMBER || `dev-${new Date().toISOString()}`;
const isDebug = (!process.env.TRAVIS_BUILD_NUMBER) + '';
const cacheId = 'fumen-for-mobile';

module.exports = {
    entry: [
        './src/actions.ts'
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, 'public')
    },
    module: {
        rules: [
            {
                test: /env\.ts$/,
                loader: 'string-replace-loader',
                options: {
                    search: '###VERSION###',
                    replace: version,
                }
            },
            {
                test: /env\.ts$/,
                loader: 'string-replace-loader',
                options: {
                    search: '###DEBUG###',
                    replace: isDebug,
                }
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader'
            },
        ]
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: 'initial',
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    plugins: [
        new GenerateSW({
            cacheId: cacheId,
            swDest: 'sw.js',
            globDirectory: './public/',
            globPatterns: ['**/*.{png,html,css,svg,json,bundle.js}'],
            globIgnores: ['*.js'],
            clientsClaim: true,
            skipWaiting: true,
            offlineGoogleAnalytics: true,
            runtimeCaching: [
                {
                    urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/materialize\/.+\.(js|css)$/,
                    handler: "CacheFirst",
                    options: {
                        cacheName: cacheId + "-materialize-cache",
                        expiration: {
                            maxAgeSeconds: 60 * 60 * 24 * 180,
                        },
                    },
                },
                {
                    urlPattern: /^https:\/\/fonts\.googleapis\.com\/icon\?family=Material\+Icons$/,
                    handler: "CacheFirst",
                    options: {
                        cacheName: cacheId + "-materialize-font-cache",
                        expiration: {
                            maxAgeSeconds: 60 * 60 * 24 * 180,
                        },
                    },
                },
            ],
        })
    ]
};
