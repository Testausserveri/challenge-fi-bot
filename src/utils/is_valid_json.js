/**
 * Check if something is valid json.
 * 
 * Empty JSON is also considered invalid.
 * @param {*} value The variable to test
 * @returns {boolean}
 */
module.exports = function (value) {
    if (typeof value !== "object" && !Array.isArray(value)) value = value.toString() // This should work on all sorts of buffers. Objects and such will break.
    else return false
    try {
        const possiblyJson = JSON.parse(value)
        if (Object.keys(possiblyJson) > 0) return true // Empty JSON is considered invalid JSON. Why would you want to parse an empty object?
    }
    catch(e) {
        return false
    }
    finally {
        return false
    }
}