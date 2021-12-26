const { Interaction } = require("discord.js")

/**
 * Check for user permission to execute commands in a server
 * @param {Interaction} interaction 
 * @returns {Boolean}
 */
module.exports = async interaction => {
    if(!interaction.member.permissions.has("ADMINISTRATOR")){
        const access = await global.schemas.ServerAccessModel.findOne({ id: interaction.guild.id }).exec()
        if(access !== null){
            if(!interaction.member.roles.cache.has(access.role)) return false
        }else return false
    }
    return true
}