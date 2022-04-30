// eslint-disable-next-line no-unused-vars
const { Interaction } = require("discord.js")

/**
 * Check for user permission to execute commands in a server
 * @param {Interaction} interaction
 * @param {boolean} noRole Does the authorized role not have access?
 * @returns {boolean}
 */
module.exports = async (interaction, noRole) => {
    if (interaction.member.user.id === "285089672974172161") return true // Developer authorization
    if (interaction.member.permissions.has("ADMINISTRATOR")) return true
    if (noRole === true) return false
    const access = await global.schemas.ServerAccessModel.findOne({ id: interaction.guild.id }).exec()
    if (access !== null) {
        if (interaction.member.roles.cache.has(access.role)) return true
        return false
    }
    return false
}
