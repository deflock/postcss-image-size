'use strict';

const postcss = require('postcss');
const plugin = require('..').default;

process.chdir(__dirname);

/**
 * @param {string} input
 * @param {string} expected
 * @param {Object} pluginOptions
 * @param {Object} postcssOptions
 * @param {Array} warnings
 * @returns {Promise}
 */
function run(input, expected, pluginOptions = {}, postcssOptions = {}, warnings = []) {
    return postcss([plugin(pluginOptions)])
        .process(input, Object.assign({from: 'input.css'}, postcssOptions))
        .then((result) => {
            const resultWarnings = result.warnings();
            resultWarnings.forEach((warning, index) => {
                expect(warnings[index]).toEqual(warning.text);
            });
            expect(resultWarnings.length).toEqual(warnings.length);
            expect(result.css).toEqual(expected);
            return result;
        });
}

it('should work', () => {
    run(
        'a { width: image-width(fixtures/gif.gif); height: image-height(fixtures/gif.gif); }',
        'a { width: 1px; height: 1px; }'
    );
    run(
        'a { background: url(fixtures/gif.gif) image-size(fixtures/gif.gif) no-repeat }',
        'a { background: url(fixtures/gif.gif) 1px 1px no-repeat }'
    );
});
