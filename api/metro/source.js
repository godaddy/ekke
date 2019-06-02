const diagnostics = require('diagnostics');
const crypto = require('crypto');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

//
// Dedicated debugger.
//
const debug = diagnostics('ekke:source');

/**
 * Generates source file that contains all the required imports.
 *
 * @param {String[]} [globs] The glob patterns that gather the files.
 * @param {String} moduleName Fake module name of the application root.
 * @param {String} using The test runner that needs to be bundled.
 * @returns {Promise<string>} Location of our fake file.
 * @public
 */
async function source({ globs = [], moduleName, using = 'mocha' }) {
  const files = [];

  //
  // It could be that we've gotten multiple glob patterns, so we need to
  // iterate over each.
  //
  globs.filter(Boolean).forEach(function find(file) {
    if (!~file.indexOf('*')) return files.push(file);

    Array.prototype.push.apply(files, glob.sync(file));
  });

  //
  // Map the require files to the fake package name we've created.
  //
  const requires = files
    .map(file => path.join(moduleName, file))
    .map(file => file.replace(/\\/g, '\\\\'))
    .map(file => `require("${file}");`)
    .join('\n');

  //
  // Create dummy content for the source which allows to get access to:
  //
  // - The selected test runner library, as that needs to be executed in RN.
  // - The suites.
  //
  // All neatly exported when we require the first moduleId, 0.
  //
  const template = fs.readFileSync(path.join(__dirname, 'template.js'), 'utf-8');
  const content = template
    .replace('${requires}', requires)
    .replace('${runner}', using)
    .replace('${browser}', using === 'mocha')
    .replace('${__dirname}', process.cwd());

  debug('compiled template', content);

  const ref = `${crypto.createHash('sha256').update(content).digest('hex')}.js`;
  const location = path.join(__dirname, '..', 'tmp', ref);

  debug(`generating fake source file at(${location})`, content);
  fs.writeFileSync(location, content);

  return location;
}

//
// Expose our hack.
//
module.exports = source;
