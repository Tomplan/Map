const fs = require('fs');
let code = fs.readFileSync('eslint.config.js', 'utf8');
code = code.replace(
  'export default defineConfig([',
  "export default defineConfig([\n  { ignores: ['.git/**', 'node_modules/**', 'dist/**', 'build/**', 'coverage/**'] },"
);
// Remove the old ignores inside the block
code = code.replace(
  "    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],",
  ""
);
fs.writeFileSync('eslint.config.js', code);
console.log('Fixed eslint flat config ignores!');
