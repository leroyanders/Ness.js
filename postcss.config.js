const tailwindcss = require('tailwindcss');
module.exports = {
    plugins: [
        'postcss-import',
        tailwindcss('./tailwind.config.js'),
        require('autoprefixer')
    ],
};