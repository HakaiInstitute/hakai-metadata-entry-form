/* eslint no-param-reassign: ["error", { "props": false }] */
module.exports = {
    webpack(config) {
        const fallback = config.resolve.fallback || {};
        Object.assign(fallback, {
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            assert: false, // require.resolve("assert") can be polyfilled here if needed
            http: require.resolve("stream-http"),
            https: require.resolve("https-browserify"),
            os: false, // require.resolve("os-browserify") can be polyfilled here if needed
            url: require.resolve("url/"),
            zlib: false, // require.resolve("browserify-zlib") can be polyfilled here if needed
            querystring: require.resolve("querystring-es3"),
            util: require.resolve("util/"),
            path: require.resolve("path-browserify"),
        });
        config.resolve.fallback = fallback;
        config.ignoreWarnings = [/Failed to parse source map/];
        config.module.rules.push({
            test: /\.(js|mjs|jsx)$/,
            enforce: "pre",
            loader: require.resolve("source-map-loader"),
            resolve: {
                fullySpecified: false,
            },
        });
        return config;
    },
    devServer(configFunction) {
        // Return the replacement function for create-react-app to use to generate the Webpack
        // Development Server config. "configFunction" is the function that would normally have
        // been used to generate the Webpack Development server config - you can use it to create
        // a starting configuration to then modify instead of having to create a config from scratch.
        return function (proxy, allowedHost) {
            // Create the default config by calling configFunction with the proxy/allowedHost parameters
            const config = configFunction(proxy, allowedHost);

            config.client.overlay.runtimeErrors = (error) => {
                console.log(error.message);
                if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
                    return false;
                }
                return true;
            }

            // Return your customised Webpack Development Server config.
            return config;
        };
    },
};