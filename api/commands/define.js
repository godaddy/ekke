/**
 * Defines the function as a command.
 *
 * @param {AsyncFunction} command The command to define.
 * @param {Object} details Details about the command.
 * @returns {AsyncFunction} The given command.
 * @public
 */
function define(command, details = {}) {
  /**
   * Transforms the given data into an array, or flattens it.
   *
   * @param {Mixed|Array} data Items that should be an array.
   * @returns {Array} Data.
   * @private
   */
  function asArray(data) {
    return [].concat(data).filter(Boolean);
  }

  /**
   * Transform the given description into an array of sentences.
   *
   * @param {String|Array} desc description to chop.
   * @returns {Array} Them lines.
   * @private
   */
  function sentences(desc = '') {
    return !Array.isArray(desc)
    ? desc.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/)
    : desc;
  }

  //
  // So we want to use the first sentance as a brief description of the command.
  //
  details.debug = details.debug || `ekke:${details.name || command.name}`;
  details.description = sentences(details.description);
  details.examples = asArray(details.examples);
  details.flags = details.flags || {};
  details.ekke = 'ekke-ekke-ekke';

  Object.keys(details.flags).forEach(function parse(flag) {
    details.flags[flag] = sentences(details.flags[flag]);
  });

  //
  // Expose on the provided function, or object.
  //
  Object.keys(details).forEach(function assign(key) {
    command[key] = details[key];
  });

  return command;
}

//
// Expose our interface.
//
module.exports = define;
