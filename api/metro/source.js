const diagnostics = require('diagnostics');
const { promisify } = require('util');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

//
// Set up promises, if we use `fs.promises` it outputs an experimental warning
// in the stdout, so we want to avoid that for now until they either remove
// the message or the API become stable.
//
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

//
// Dedicated debugger.
//
const debug = diagnostics('ekke:source');

/**
 * Transform an array of sources to an object that requires the sources.
 *
 * @param {Array} sources Files that should be required.
 * @param {String} prefix Prefix of the file location.
 * @returns {String} An object with require statements.
 * @private
 */
function transform(sources = [], prefix = '') {
  const data = sources.reduce(function resolve(memo, file) {
    memo[file] = path.join(prefix, file);
    return memo;
  }, {});

  const obj = sources.reduce(function reduce(memo, key) {
    memo[key] = '%'+ key +'%';
    return memo;
  }, {});

  //
  // We want to use an object structure with require statements, but also
  // want the generated source to be readable and understandable so we are
  // going to pretty prety the created object template and replace the values.
  //
  let result = JSON.stringify(obj, null, 2);

  Object.keys(data).forEach(function replace(key) {
    const tag = '"%'+ key.replace(/\\/g, '\\\\') +'%"';
    result = result.replace(tag, 'require('+ JSON.stringify(data[key]) +')');
  });

  return result;
}

/**
 * Generates source file that contains all the required imports.
 *
 * @param {String[]} [globs] The glob patterns that gather the files.
 * @param {String} moduleName Fake module name of the application root.
 * @returns {Promise<string>} Location of our fake file.
 * @public
 */
async function source(data) {
  const { moduleName, browser, requires, plugins, globs } = data;
  const library = 'library' in data ? `require(${JSON.stringify(data.library)})` : JSON.stringify(data.library);

  //
  // Create dummy content for the source which allows to get access to:
  //
  // - The selected test runner library, as that needs to be executed in RN.
  // - The suites.
  //
  // All neatly exported when we require the first moduleId, 0.
  //
  const template = await readFile(path.join(__dirname, 'template.js'), 'utf-8');
  const content = template
    .replace('${globs}', transform(globs, moduleName))
    .replace('${requires}', transform(requires))
    .replace('${plugins}', transform(plugins))
    .replace('${__dirname}', process.cwd())
    .replace('${browser}', !!browser)
    .replace('${library}', library);

  debug('compiled template', content);

  const ref = `${crypto.createHash('sha256').update(content).digest('hex')}.js`;
  const location = path.join(__dirname, '..', 'tmp', ref);

  debug(`generating fake source file at(${location})`, content);
  await writeFile(location, content);

  return location;
}

//
// Expose the transform method for testing.
//
source.transform = transform;

//
// Expose our hack.
//
module.exports = source;
