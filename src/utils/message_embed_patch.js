const { MessageEmbed } = require("discord.js")

/**
 * Patch .addField to trim each line separately.
 */
module.exports = class PatchedMessageEmbed extends MessageEmbed {
    /**
     * @param {string} name
     * @param {string} value
     * @param {boolean} inline
     * @returns {MessageEmbed}
     */
    addField(name, value, inline) {
        this.addFields({ name, value: value.split("\n").map((line) => line.trim()).join("\n"), inline })
        return this
    }
}
