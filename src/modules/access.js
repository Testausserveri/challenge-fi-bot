const { Interaction } = require("discord.js");
/**
 * Configure who can use bot commands
 * @param {Interaction} interaction 
 */
module.exports = interaction => {
    if(interaction.commandName === "configure-access"){
        if(interaction.member.permissions.has("ADMINISTRATOR")){
            const roleId = interaction.options._hoistedOptions[0]?.value
            if(roleId !== null && interaction.guild.roles.cache.has(roleId)){
                global.schemas.ServerAccessModel.findOneAndUpdate(
                    { id: interaction.guild.id },
                    { id: interaction.guild.id, role: roleId },
                    { upsert: true }
                ).exec().then(() => {
                    interaction.reply({
                        content: "Allowed access for `" + roleId + "`",
                        ephemeral: true
                    })
                })
            }else {
                interaction.reply({
                    content: "Invalid role id.",
                    ephemeral: true
                })
            }
        }else {
            interaction.reply({
                content: "Permission denied.",
                ephemeral: true
            })
        }
    }
}