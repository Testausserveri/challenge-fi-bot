// eslint-disable-next-line no-unused-vars
const { Interaction } = require("discord.js")
// const slashCommands = require("../configuration/slash_commands")
const checkForAccess = require("../utils/check_for_access")

/**
 * Configure who can use bot commands
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isCommand() && interaction.commandName === "configure-access") {
        await interaction.deferReply({
            ephemeral: true
        })
        if (checkForAccess(interaction, true)) {
            const roleId = interaction.options.get("role_id")?.value
            const role = await interaction.guild.roles.fetch(roleId)
            if (roleId !== null && role !== null) {
                await global.schemas.ServerAccessModel.findOneAndUpdate(
                    { id: interaction.guild.id },
                    { id: interaction.guild.id, role: roleId },
                    { upsert: true }
                ).exec()
                // Update slash commands
                // NOTE: This feature has been removed by Discord (without notice...)
                /* const newConfiguration = JSON.parse(JSON.stringify(slashCommands)).map((command) => { command.defaultPermission = false; return command })
                const commands = await interaction.guild.commands.fetch()
                await interaction.guild.commands.set(newConfiguration)
                const permissionUpdatesBulk = []
                // eslint-disable-next-line no-restricted-syntax
                for (const command of commands) {
                    permissionUpdatesBulk.push({
                        id: command[0],
                        permissions: [
                            {
                                id: roleId,
                                type: "ROLE",
                                permission: true
                            },
                            // Server owner
                            {
                                id: interaction.guild.ownerId,
                                type: "USER",
                                permission: true
                            }
                        ]
                    })
                }
                await interaction.guild.commands.permissions.set({ fullPermissions: permissionUpdatesBulk }) */
                interaction.followUp({
                    content: `Allowed access for \`${roleId}\``,
                    ephemeral: true
                })
            } else {
                interaction.followUp({
                    content: "Invalid role id.",
                    ephemeral: true
                })
            }
        } else {
            interaction.followUp({
                content: "Permission denied.",
                ephemeral: true
            })
        }
    } else {
        next()
    }
}
