/**
 * Find a message from a guild
 * @param {String} id 
 * @param {Guild} guild
 * @returns {Message}
 */
module.exports = async function (id, guild){
    console.log("Find", id, guild)
    const channels = guild.channels.cache.filter(c => c.type === "GUILD_TEXT")
    for(const channel of channels){
        try {
            const target = await channel[1].messages.fetch(id, { force: true })
            if(target) return target
        }
        catch(_){}
    }
    return null
}