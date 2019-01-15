import nodepath from 'path';
import nodefs from 'fs';
import postcss from 'postcss';
import sizeOf from 'image-size';

const PLUGIN_NAME = 'deflock-image-size';

const WIDTH_DEFAULT_PATTERNS = [/(?:img|image)-width\(\s*['"]?([^"')]+)["']?\s*\)/gi];
const HEIGHT_DEFAULT_PATTERNS = [/(?:img|image)-height\(\s*['"]?([^"')]+)["']?\s*\)/gi];
const SIZE_DEFAULT_PATTERNS = [/(?:img|image)-size\(\s*['"]?([^"')]+)["']?\s*\)/gi];

/**
 *
 */
export default postcss.plugin(PLUGIN_NAME, (opts = {}) => {
    const options = Object.assign({}, {
        widthPatterns: WIDTH_DEFAULT_PATTERNS,
        heightPatterns: HEIGHT_DEFAULT_PATTERNS,
        sizePatterns: SIZE_DEFAULT_PATTERNS,
    }, opts);

    const cache = {};

    /**
     * @param {Object} decl
     * @param {*} matched
     * @param {string} path
     * @returns {string}
     */
    function sizes(decl, matched, path) {
        const declfile = decl.source && decl.source.input && decl.source.input.file;
        const fullpath = nodepath.resolve(nodepath.dirname(declfile), path);

        if (!fullpath) {
            throw new Error(`Path ${path} cannot be resolved`);
        }

        if (cache[fullpath]) {
            return cache[fullpath];
        }

        if (!nodefs.existsSync(fullpath)) {
            throw new Error(`File "${fullpath}" does not found`);
        }

        return cache[fullpath] = sizeOf(fullpath, null);
    }

    return (css, result) => {
        css.walkDecls(decl => {
            const widthPatterns = Array.isArray(options.widthPatterns)
                ? options.widthPatterns
                : [options.widthPatterns];
            for (const pattern of widthPatterns) {
                if (pattern.test(decl.value)) {
                    decl.value = decl.value.replace(pattern, (...args) => `${sizes(decl, ...args).width}px`);
                }
            }

            const heightPatterns = Array.isArray(options.heightPatterns)
                ? options.heightPatterns
                : [options.heightPatterns];
            for (const pattern of heightPatterns) {
                if (pattern.test(decl.value)) {
                    decl.value = decl.value.replace(pattern, (...args) => `${sizes(decl, ...args).height}px`);
                }
            }

            const sizePatterns = Array.isArray(options.sizePatterns)
                ? options.sizePatterns
                : [options.sizePatterns];
            for (const pattern of sizePatterns) {
                if (pattern.test(decl.value)) {
                    decl.value = decl.value.replace(pattern, (...args) => {
                        const dimensions = sizes(decl, ...args);
                        return `${dimensions.width}px ${dimensions.height}px`;
                    });
                }
            }
        });
    };
});
