const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
require("dotenv").config();

module.exports = (env, argv) => {
    const isProd = argv.mode === "production";
    return {
        entry: "./src/app/index.tsx",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: isProd ? "[name].[contenthash].js" : "[name].js",
            chunkFilename: isProd ? "[name].[contenthash].js" : "[name].js",
            clean: true,
        },
        performance: {
            maxAssetSize: 512000,
            maxEntrypointSize: 524288,
        },
        mode: isProd ? "production" : "development",
        devServer: {
            static: {
                directory: path.join(__dirname, "dist"),
            },
            port: 3000,
            open: true,
            hot: true,
            historyApiFallback: true,
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                    },
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.svg$/,
                    type: "asset/resource",
                    generator: {
                        filename: "assets/images/[name][ext]",
                    },
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./public/index.html",
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "public",
                        to: "",
                        globOptions: {
                            ignore: ["**/index.html"], // Ignore index.html since HtmlWebpackPlugin handles it
                        },
                    },
                ],
            }),
            new webpack.DefinePlugin({
                "process.env.REACT_APP_API_BASE_URL": JSON.stringify(
                    process.env.REACT_APP_API_BASE_URL || ""
                ),
                "process.env.REACT_APP_AUTH_USERNAME": JSON.stringify(
                    process.env.REACT_APP_AUTH_USERNAME || ""
                ),
                "process.env.REACT_APP_AUTH_PASSWORD": JSON.stringify(
                    process.env.REACT_APP_AUTH_PASSWORD || ""
                ),
            }),
        ],
        resolve: {
            extensions: [".tsx", ".ts", ".js", ".jsx"],
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
        optimization: {
            splitChunks: {
                chunks: "all",
                cacheGroups: {
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name: "vendors",
                        chunks: "all",
                    },
                },
            },
            runtimeChunk: "single",
        },
    };
};
