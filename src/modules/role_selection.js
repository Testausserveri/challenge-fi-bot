/* eslint-disable no-restricted-syntax */
const {
    // eslint-disable-next-line no-unused-vars
    Interaction,
    // eslint-disable-next-line no-unused-vars
    TextChannel,
    MessageEmbed,
    MessageAttachment,
    // eslint-disable-next-line no-unused-vars
    Message,
    MessageActionRow,
    MessageButton
} = require("discord.js")
const request = require("../utils/request")
const checkForAccess = require("../utils/check_for_access")
const findMessage = require("../utils/find_message")

/**
 * Create a role selection embed
 * @param {String} title The embed title
 * @param {String} description The embed description
 * @param {String} footer The embed footer
 * @param {String} image The embed thumbnail
 * @param {TextChannel} channel The text channel to place the role selection in
 * @returns {Promise<Message>}
 */
async function createRoleSelection(title, description, footer, image, color, channel) {
    const embed = new MessageEmbed({
        title,
        description
    })
    let thumbnailAttachment = null
    if (image !== undefined) {
        thumbnailAttachment = new MessageAttachment(new Buffer.from(image, "base64"), "thumbnail.png")
        embed.setThumbnail("attachment://thumbnail.png")
    }
    if (footer !== undefined) embed.setFooter(footer)
    if (color !== undefined) embed.setColor(color)
    embed.setAuthor("Role selection")
    embed.addField("How to use", "Click the buttons below to select roles. The buttons function as toggles.")
    const msg = await channel.send({ embeds: [embed], files: thumbnailAttachment !== null ? [thumbnailAttachment] : undefined })
    return msg
}

/**
 * Generate button components from a list
 * @param {Object} list The button configuration
 * @returns {MessageButton[]}
 */
function generateButtonComponents(list) {
    const components = []
    for (const key of Object.keys(list)) {
        components.push(new MessageButton()
            .setStyle("PRIMARY")
            .setLabel(list[key])
            .setCustomId(key))
    }
    return components
}

/**
 * Role selection module
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isButton()) {
        // Handle button click
        const roleId = interaction.customId
        const roleSelection = await global.schemas.RoleSelectionModel.findOne({ message: interaction.message.id, id: interaction.guild.id }).exec()
        if (roleSelection === null) {
            // Not a role selection click
            next()
            return
        }
        const role = await interaction.guild.roles.fetch(roleId)
        try {
            let msg = ""
            if (interaction.member.roles.cache.has(roleId)) {
                await interaction.member.roles.remove(roleId)
                msg = "removed from"
            } else {
                await interaction.member.roles.add(roleId)
                msg = "added to"
            }
            interaction.reply({
                content: `✅ Role \`${role.name}\` ${msg} your account.`,
                ephemeral: true
            })
        } catch (e) {
            if (!interaction.replied) await interaction.deferReply({ ephemeral: true })
            interaction.followUp({
                content: "An error occurred :(",
                ephemeral: true
            })
        }
    } else if (interaction.isCommand()) {
        // Handle slash command
        // eslint-disable-next-line no-lonely-if
        if (interaction.commandName === "role-selection") {
            // Check for access
            if (!(await checkForAccess(interaction))) {
                interaction.reply({
                    content: "Permission denied.",
                    ephemeral: true
                })
                return
            }

            // Handle application commands
            if (interaction.options.getSubcommand() === "create") {
                await interaction.deferReply({
                    ephemeral: true
                })
                let title; let description; let footer; let image; let
                    color = null
                for await (const option of interaction.options.data[0].options) {
                    // eslint-disable-next-line default-case
                    switch (option.name) {
                    case "title": {
                        title = option.value
                        break
                    }
                    case "description": {
                        description = option.value
                        break
                    }
                    case "footer": {
                        footer = option.value
                        break
                    }
                    case "color": {
                        color = /^#([0-9a-f]{3}){1,2}$/i.test(option.value) ? option.value : null
                        break
                    }
                    case "thumbnail_url": {
                        // This is more complex,
                        // download the image with a get from the URL and convert to base 64
                        try {
                            // Only allow Discord CDN urls
                            const url = new URL(option.value)
                            if (global.whitelistedHosts.includes(url.host)) {
                                const imageRequest = await request("GET", option.value, {}, null)
                                if (imageRequest.status === 200) {
                                    image = imageRequest.data.toString("base64")
                                } else {
                                    image = false
                                }
                            } else {
                                image = false
                            }
                        } catch (_) {
                            image = false
                        }
                    }
                    }
                }
                if (image === false) { // Image download failed
                    interaction.followUp({
                        content: "Failed to download image. (Only PNGs and urls from Discord's CDNs are allowed!)",
                        ephemeral: true
                    })
                } else {
                    // Add database entry
                    const numberOfSelections = (await global.schemas.RoleSelectionModel.find({ id: interaction.guild.id }).exec()).length
                    if (numberOfSelections >= 5) {
                        // This limit can be easily removed, just set some other max number
                        interaction.followUp({
                            content: "For now there can only be `5` role selections per server.",
                            ephemeral: true
                        })
                    } else {
                        const msg = await createRoleSelection(title, description, footer, image, color, interaction.channel)
                        global.schemas.RoleSelectionModel.findOneAndUpdate(
                            { id: interaction.guild.id, message: msg.id },
                            {
                                id: interaction.guild.id,
                                embed: {
                                    title,
                                    description,
                                    footer,
                                    image
                                },
                                message: msg.id,
                                roles: {}
                            },
                            { upsert: true }
                        ).exec().then(() => {
                            interaction.followUp({
                                content: `Role selection created. Id: \`${msg.id}\``,
                                ephemeral: true
                            })
                        }).catch((e) => {
                            console.error(e)
                            msg.delete()
                            interaction.followUp({
                                content: "Failed.",
                                ephemeral: true
                            })
                        })
                    }
                }
            } else if (interaction.options.getSubcommand() === "add-option") {
                await interaction.deferReply({
                    ephemeral: true
                })
                const messageId = interaction.options.get("message_id")?.value
                const text = interaction.options.get("button_text")?.value
                const roleId = interaction.options.get("role_id")?.value
                const roleSelection = await global.schemas.RoleSelectionModel.findOne({ message: messageId, id: interaction.guild.id }).exec()
                if (roleSelection === null) {
                    interaction.followUp({
                        content: "No such role selection exists for this server.",
                        ephemeral: true
                    })
                } else if (interaction.guild.roles.resolve(roleId) !== null) {
                    // Make sure the role is not yet an option
                    const notAnOption = Object.keys(JSON.parse(JSON.stringify(roleSelection.roles))).filter((id) => id === roleId).length === 0
                    if (notAnOption) {
                        // Fetch the message
                        const msg = await findMessage(roleSelection.message, interaction.guild)
                        if (!msg) {
                            global.schemas.RoleSelectionModel.findOneAndRemove({ id: interaction.guild.id }).exec()
                            interaction.followUp({
                                content: "This role selection has expired.",
                                ephemeral: true
                            })
                            return
                        }
                        // Update the database
                        console.debug("ROLES", roleSelection)
                        if (roleSelection.roles === undefined) roleSelection.roles = {}
                        roleSelection.roles[roleId] = text
                        global.schemas.RoleSelectionModel.findOneAndUpdate(
                            { id: interaction.guild.id },
                            {
                                $set: { roles: roleSelection.roles }
                            }
                        ).exec().then(() => {
                            // Edit the message
                            const components = new MessageActionRow()
                            components.addComponents(...generateButtonComponents(roleSelection.roles))
                            msg.edit({ components: [components] })
                            interaction.followUp({
                                content: "Option added.",
                                ephemeral: true
                            })
                        }).catch((e) => {
                            console.error(e)
                            interaction.followUp({
                                content: "Failed.",
                                ephemeral: true
                            })
                        })
                    } else {
                        interaction.followUp({
                            content: "The specified role is already selectable.",
                            ephemeral: true
                        })
                    }
                } else {
                    interaction.followUp({
                        content: "No such role exists.",
                        ephemeral: true
                    })
                }
            } else if (interaction.options.getSubcommand() === "remove-option") {
                await interaction.deferReply({
                    ephemeral: true
                })
                const roleId = interaction.options.get("role_id").value
                const roleSelection = await global.schemas.RoleSelectionModel.findOne({ id: interaction.guild.id }).exec()
                if (roleSelection === null) {
                    interaction.followUp({
                        content: "No role selection exists for this server.",
                        ephemeral: true
                    })
                } else if (interaction.guild.roles.resolve(roleId) !== null) {
                    // Make sure the role is not yet an option
                    const notAnOption = Object.keys(roleSelection.roles).filter((id) => id === roleId).length === 0
                    if (!notAnOption) {
                        // Fetch the message
                        const msg = await findMessage(roleSelection.message, interaction.guild)
                        if (!msg) {
                            global.schemas.RoleSelectionModel.findOneAndRemove({ id: interaction.guild.id }).exec()
                            interaction.followUp({
                                content: "This role selection has expired.",
                                ephemeral: true
                            })
                            return
                        }
                        // Update the database
                        delete roleSelection.roles[roleId]
                        global.schemas.RoleSelectionModel.findOneAndUpdate(
                            { id: interaction.guild.id },
                            {
                                $set: { roles: roleSelection.roles }
                            }
                        ).exec().then(() => {
                            // Edit the message
                            const components = new MessageActionRow()
                            components.addComponents(...generateButtonComponents(roleSelection.roles))
                            msg.edit({ components: [components] })
                            interaction.followUp({
                                content: "Option removed.",
                                ephemeral: true
                            })
                        }).catch((e) => {
                            console.error(e)
                            interaction.followUp({
                                content: "Failed.",
                                ephemeral: true
                            })
                        })
                    } else {
                        interaction.followUp({
                            content: "The specified role is not selectable.",
                            ephemeral: true
                        })
                    }
                } else {
                    interaction.followUp({
                        content: "No such role exists.",
                        ephemeral: true
                    })
                }
            } else if (interaction.options.getSubcommand() === "remove") {
                await interaction.deferReply({
                    ephemeral: true
                })
                const messageId = interaction.options.get("message_id").value
                const roleSelection = await global.schemas.RoleSelectionModel.findOne({ message: messageId, id: interaction.guild.id }).exec()
                if (roleSelection !== null) {
                    await global.schemas.RoleSelectionModel.findOneAndRemove({ message: messageId, id: interaction.guild.id }).exec()
                    const msg = await findMessage(roleSelection.message, interaction.guild)
                    if (msg) await msg.delete()
                    interaction.followUp({
                        content: "Role selection removed.",
                        ephemeral: true
                    })
                } else {
                    interaction.followUp({
                        content: "No such role selection exists.",
                        ephemeral: true
                    })
                }
            }
        } else {
            next()
        }
    } else {
        next()
    }
}
