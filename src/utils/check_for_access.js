// eslint-disable-next-line no-unused-vars
const { Interaction } = require("discord.js")

/**
 * Check for user permission to execute commands in a server
 * @param {Interaction} interaction
 * @returns {Boolean}
 */
module.exports = async (interaction) => {
    if (interaction.member.permissions.has("ADMINISTRATOR")) return true
    const access = await global.schemas.ServerAccessModel.findOne({ id: interaction.guild.id }).exec()
    if (access !== null) {
        if (interaction.member.roles.cache.has(access.role)) return true
        return false
    }
    return false
}
