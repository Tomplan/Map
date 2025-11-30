// Safe PostCSS config that only loads available plugins
let plugins = [];

try {
  if (require.resolve('tailwindcss')) {
    plugins.push(require('tailwindcss'));
  }
} catch (e) {
  // TailwindCSS not available
}

try {
  if (require.resolve('autoprefixer')) {
    plugins.push(require('autoprefixer'));
  }
} catch (e) {
  // Autoprefixer not available
}

module.exports = {
  plugins: plugins,
};