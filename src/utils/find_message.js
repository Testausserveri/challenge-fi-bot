// eslint-disable-next-line no-unused-vars
const { Message } = require("discord.js")
/**
 * Find a message from a guild
 * @param {String} id
 * @param {Guild} guild
 * @returns {Message}
 */
module.exports = async (id, guild) => {
    const channels = guild.channels.cache.filter((c) => c.type === "GUILD_TEXT")
    // eslint-disable-next-line no-restricted-syntax
    for await (const channel of channels) {
        try {
            const target = await channel[1].messages.fetch(id, { force: true })
            if (target) return target
        // eslint-disable-next-line no-empty
        } catch (e) {}
    }
    return null
}
