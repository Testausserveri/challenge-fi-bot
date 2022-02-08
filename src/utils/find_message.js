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
    // Caching
    if (global.messageLocationCache !== undefined && global.messageLocationCache[`${guild.id}-${id}`] !== undefined) {
        // Cache timestamp
        if (global.messageLocationCache.age === undefined) global.messageLocationCache.age = new Date().getTime()

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            // Maximum timeout, cache flush
            let doNotComplete = false
            const flushTimeout = setTimeout(async () => {
                if (global.messageLocationCache === undefined || (typeof global.messageLocationCache === "object" && Object.keys(global.messageLocationCache).length === 0)) return
                // Cache flushing can occur max one time per minute
                if (global.messageLocationCache.age !== undefined && global.messageLocationCache.age + 60000 < new Date().getTime()) return
                console.warn("Message cache is being flushed!")
                global.messageLocationCache = {}
                doNotComplete = true
                const retry = await this(id, guild)
                resolve(retry)
            }, 60000) // 60 seconds is maximum timeout

            // Find with cached location
            const channel = await guild.channels.fetch(global.messageLocationCache[`${guild.id}-${id}`])
            global.messageLocationCache[`${guild.id}-${id}`] = undefined // Reset the cache if the message does not exist
            if (!channel) {
                resolve(null)
                clearTimeout(flushTimeout)
                return
            }
            const target = await channel.messages.fetch(id, { force: true })
            if (!target) {
                resolve(null)
                clearTimeout(flushTimeout)
                return
            }
            if (!doNotComplete) {
                global.messageLocationCache[`${guild.id}-${id}`] = channel.id // Add back to cache, as the message exists
                clearTimeout(flushTimeout)
                resolve(target)
            }
        })
    }
    // Locate message by querying every channel
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
