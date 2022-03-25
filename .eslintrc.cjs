/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,  
  parserOptions: {
    ecmaVersion: '2021', // Allows for the parsing of modern ECMAScript features
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-prettier",
    'prettier',
  ],
  plugins: [
    "vue",
  ],
  env: {
    "vue/setup-compiler-macros": true,
    node: true,
    browser: true,
  },
};
