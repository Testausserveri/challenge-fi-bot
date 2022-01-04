/**
 * Get the appropriate "ending" for a placement number
 * @param {Number} number
 * @returns {String}
 */
module.exports = (number) => {
    const string = number.toString()
    if(/(11|12|13)$/.test(string)) return "th" // "teen"-exception
    if (string.endsWith("1")) return "st"
    if (string.endsWith("2")) return "nd"
    if (string.endsWith("3")) return "rd"
    return "th"
}
