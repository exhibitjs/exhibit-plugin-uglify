import _ from 'lodash';
import convertSourceMap from 'convert-source-map';
import path from 'path';
import { cache, matcher } from 'exhibit';
import { minify } from 'uglify-js';
import { red } from 'chalk';

const defaults = {
  match: '**/*.js',
  map: false,
};

const permittedOptions = [
  'warnings', 'mangle', 'mangleProperties',
  'output', 'compress', 'parse', 'regex',
];

export default function (_options) {
  const options = _.assign({}, defaults, _options);
  const match = matcher(options.match);

  const uglifyOptions = _.pick(options, permittedOptions);

  return cache(async (content, name) => {
    if (!match(name)) return content;

    const source = content.toString();

    let result;
    try {
      result = minify(source, _.assign({}, uglifyOptions, {
        fromString: true,
        outSourceMap: Boolean(options.map ? `${path.basename(name)}.map` : null),
      }));
    } catch (error) {
      console.error(red(`exhibit-plugin-uglify: failed to minifiy ${name}`));
      throw error;
    }

    if (options.map) {
      const comment = convertSourceMap
        .fromObject(JSON.parse(result.map))
        .setProperty('sources', [name])
        .setProperty('sourcesContent', [source])
        .toComment();

      return `${result.code}\n${comment}`;
    }

    return result.code;
  });
}
