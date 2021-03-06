const path = require("path");

module.exports = {
  overrideWebpackConfig: ({
    webpackConfig,
    cracoConfig,
    pluginOptions,
    context: { env, paths },
  }) => {
    // console.log({ env, paths });
    paths.appBuild = path.resolve(__dirname, "./packageToPublish");
    if (env === "production" && process.env.library) {
      webpackConfig.entry = [path.resolve(__dirname, "./src/library.ts")];
      webpackConfig.output.path = path.resolve(__dirname, "./packageToPublish");
      webpackConfig.output.filename = `[name].js`;
      webpackConfig.output.libraryTarget = `umd`;
      webpackConfig.output.libraryExport = ``;
      webpackConfig.externals = {
        react: "react",
      };

      webpackConfig.optimization = {
        minimize: true,
        splitChunks: { chunks: "all", name: false, minSize: Math.pow(10, 10) },
        // splitChunks: undefined,
      };

      const pluginsToKeep = new Set([
        "ForkTsCheckerWebpackPlugin",
        "IgnorePlugin",
        "DefinePlugin",
        "ModuleNotFoundPlugin",
        "ManifestPlugin",
        "MiniCssExtractPlugin",
      ]);

      webpackConfig.plugins = webpackConfig.plugins.filter((p) =>
        pluginsToKeep.has(p.constructor.name)
      );

      const miniCssExtractPlugin = webpackConfig.plugins.find(
        (p) => p.constructor.name === "MiniCssExtractPlugin"
      );
      // MiniCssExtractPlugin.options.filename = "";
      miniCssExtractPlugin.options.filename = "[name].css";
      miniCssExtractPlugin.options.chunkFilename = undefined;

      // console.log(webpackConfig);
      // return;
    }

    // Always return the config object.
    return webpackConfig;
  },
};
