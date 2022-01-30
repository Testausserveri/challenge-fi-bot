/**
 * Check if something is valid json.
 * @param {*} value The variable to test
 * @returns {boolean}
 */
module.exports = function (value) {
    if (typeof value !== "object" && !Array.isArray(value)) value = value.toString() // This should work on all sorts of buffers. Objects and such will break.
    else return false
    try {
        JSON.parse(value)
        return true
    }
    catch(e) {
        return false
    }
    finally {
        return false
    }
}