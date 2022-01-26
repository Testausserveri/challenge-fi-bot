// eslint-disable-next-line no-unused-vars
const { Message } = require("discord.js")
/**
 * Find a message from a guild
 * @param {String} id
 * @param {Guild} guild
 * @returns {Message}
 */
module.exports = async (id, guild) => {
    console.debug("FIND", id, guild)
    const channels = (await guild.channels.fetch()).filter((c) => ["GUILD_TEXT", "GUILD_NEWS"].includes(c.type))
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
