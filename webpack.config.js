'use strict'

const path = require('path')
const fs = require('fs')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const miniCssExtractPlugin = require('mini-css-extract-plugin')
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin')
const glob = require('glob')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

// Папка с HTML файлами
const htmlPagesPath = './src';
const htmlPlugins = fs.readdirSync(htmlPagesPath).filter(file => {
  return file.endsWith('.html');
}).map(file => {
  return new HtmlWebpackPlugin({
    template: path.join(htmlPagesPath, file),
    filename: file,
    inject: 'body'
  });
})

module.exports = (env, argv) => {
  // Определение, запущена ли сборка в режиме production
  const isProduction = argv.mode === 'production';

  const plugins = [
    ...htmlPlugins,
    new miniCssExtractPlugin({
      filename: 'assets/css/[contenthash].css',
    })
  ];

  // Добавление PurgeCSSPlugin только для продакшна
  if (isProduction) {
    plugins.push(
      new PurgeCSSPlugin({
        paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
        safelist: {
          standard: [
            // Bootstrap classes that might be added dynamically
            'fade', 'show', 'collapsing', 'overflow',
            // Modal related classes
            'modal', 'modal-dialog', 'modal-open', 'modal-backdrop', 'offcanvas-backdrop',
            // Dropdowns
            'dropdown', 'dropdown-menu', 'dropdown-toggle',
            // Popovers
            'popover', 'popover-header', 'popover-body', 'bs-popover-auto', 'h3',
            // Tooltips
            'tooltip', 'tooltip-inner', 'arrow', 'bs-popover-top-arrow', 'bs-popover-right-arrow', 'bs-popover-bottom-arrow', 'bs-popover-left-arrow',
            // Other
            'carousel', 'carousel-inner', 'carousel-item',
            // ... any other classes you want to keep
          ],
          deep: [
            // Deep classes: regex pattern for classes that follow certain naming conventions
            /^modal-/, /^carousel-/, /^tooltip-/, /^popover-/, /^dropdown-/, /^bs-popover-.*-arrow$/, /^bs-popover-/, /^offcanvas-/
            // ... any other regex patterns for classes
          ],
          greedy: [
            // Greedy classes: regex patterns for more complex class combinations
            // ... any complex selectors
          ],
          keyframes: [
            // Keyframes used in Bootstrap animations
            'fade', 'collapse', 'modal', 'carousel',
            // ... any other keyframes you want to keep
          ],
          variables: [
            // CSS variables (custom properties) that Bootstrap might use
            // ... any variables you want to keep
          ]
        },
      })
    );
  }

  return {
    mode: 'development',
    entry: './src/js/main.js',
    output: {
      filename: 'assets/js/[contenthash].js',
      chunkFilename: 'assets/js/[contenthash].js',
      path: path.resolve(__dirname, 'dist')
    },
    devServer: {
      static: path.resolve(__dirname, 'dist'),
      port: 8080,
      hot: true
    },
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.(scss)$/,
          use: [
            {
              // Adds CSS to the DOM by injecting a `<style>` tag
              loader: miniCssExtractPlugin.loader
            },
            {
              // Interprets `@import` and `url()` like `import/require()` and will resolve them
              loader: 'css-loader'
            },
            {
              // Loader for webpack to process CSS with PostCSS
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: () => [
                    autoprefixer
                  ]
                }
              }
            },
            {
              // Loads a SASS/SCSS file and compiles it to CSS
              loader: 'sass-loader'
            }
          ]
        },
        {
          test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][ext]'
          }
        }
      ]
    },
    optimization: {
      minimize: true, // Включает минимизацию
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false, // Удаляет комментарии
            },
          },
          extractComments: false, // Не извлекать комментарии в отдельный файл
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              { discardComments: { removeAll: true } }, // Удаляет все комментарии из CSS
            ],
          },
        }),
      ],
    },
  };
}