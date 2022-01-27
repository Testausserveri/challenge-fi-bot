// eslint-disable-next-line no-unused-vars
const { Message } = require("discord.js")

if (global.messageLocationCache === undefined) global.messageLocationCache = {}

/**
 * Find a message from a guild
 * @param {String} id
 * @param {Guild} guild
 * @returns {Message}
 */
module.exports = async (id, guild) => {
    if (global.messageLocationCache && global.messageLocationCache[`${guild.id}-${id}`] !== undefined) {
        const channel = await guild.channels.fetch(global.messageLocationCache[`${guild.id}-${id}`])
        global.messageLocationCache[`${guild.id}-${id}`] = undefined // Reset the cache if the message does not exist
        if (!channel) return null
        const target = await channel[1].messages.fetch(id, { force: true })
        if (!target) return null
        global.messageLocationCache[`${guild.id}-${id}`] = channel[1].id // Add back to cache, as the message exists
        return target
    }
    const channels = (await guild.channels.fetch()).filter((c) => ["GUILD_TEXT", "GUILD_NEWS"].includes(c.type))
    // eslint-disable-next-line no-restricted-syntax
    for await (const channel of channels) {
        try {
            const target = await channel[1].messages.fetch(id, { force: true })
            if (target) {
                global.messageLocationCache[`${guild.id}-${id}`] = channel[1].id
                return target
            }
        // eslint-disable-next-line no-empty
        } catch (e) {}
    }
    return null
}
