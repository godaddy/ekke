const prefix = 'EKKE_EKKE_EKKE_';

/**
 * Read data.
 *
 * @param {String} name Name of the plugin that uses env storage.
 * @returns {Mixed|Null} Returns `null` when data is not found, otherwise data.
 * @public
 */
function read(name) {
  let data = null;

  try { data = JSON.parse(process.env[prefix + name.toUpperCase()]); }
  catch (e) {}

  return data;
}

/**
 * Write new value.
 *
 * @param {String} name Name of the plugin that uses env storage.
 * @param {Mixed} data JSON.stringify-able data.
 * @public
 */
function write(name, data) {
  try {
    process.env[prefix + name.toUpperCase()] = JSON.stringify(data);
  } catch (e) {
    throw new Error(`Plugins are only allowed return JSON in the ${name} modifier`);
  }
}

//
// Expose the API.
//
module.exports = { read, write };
