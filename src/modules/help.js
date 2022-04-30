const {
    // eslint-disable-next-line no-unused-vars
    Interaction,
    MessageActionRow,
    MessageButton
} = require("discord.js")
const PatchedMessageEmbed = require("../utils/message_embed_patch")
const { version } = require("../../package.json")

/**
 * Some module
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isCommand() && interaction.commandName === "help") {
        await interaction.deferReply({
            ephemeral: true
        })
        if (interaction.options.get("command-name") !== null) {
            const command = interaction.options.get("command-name").value
            switch (command) {
            case "configure-access": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "Bot access management" })
                    .setTitle("/configure-access")
                    .setDescription(`
                        Set a role with command execution command execution privileges.
                        When used, commands are hidden from users without the role.
                    `)
                    .addField("Parameters", `
                        - \`role-id\` The id of the role you wish to grant command execution privileges to.
                    `)
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            case "ctfd": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "CTFd-platform integration" })
                    .setTitle("/ctfd")
                    .setDescription(`
                        Manage the CTFd integration.
                    `)
                    .addField("Subcommands", `‎
                        **configure-api**
                        Configure the CTFd integration. This resets all features (such as leaderboard sync & roles).
                        *Parameters*
                        - \`api-host\` The CTFd API host.
                        - \`api-token\` The CTFd API token.
                        
                        **configure-chall-notifications**
                        Configure new challenge -notifications. Leave empty to disable.
                        *Parameters*
                        - \`channel-id\` The id of the channel to send the notifications to.
                        
                        **configure-solve-notifications**
                        Configure new solve -notifications. Leave empty to disable.
                        *Parameters*
                        - \`channel-id\` The id of the channel to send the notifications to.

                        **update-token**
                        Update the API token in the current configuration.
                        *Parameters*
                        - \`api-token\` The new API token.
                    `)
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            case "help": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "CTFd-platform integration" })
                    .setTitle("/help")
                    .setDescription("Get information on how to use the bot.")
                    .addField("Parameters", `
                        - \`command-name\` The command you want to learn more about.
                    `)
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            case "poll": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "Community polls" })
                    .setTitle("/poll")
                    .setDescription("Manage community polls and find out what people want!")
                    .addField("Subcommands", `‎
                        **create**
                        Create a new poll.
                        *Parameters*
                        - \`title\` The poll title.
                        - \`description\` The poll description.
                        - \`options\` A semicolon separated list of all the poll options.
                        - \`thumbnail_url\` The poll thumbnail url* (optional).
                        - \`color\` The poll message sidebar color (optional, hex).
                        - \`duration\` How long the poll should last (optional, <number> day(s)/hour(s)/minute(s)/second(s)).

                        _*The link must point to a Discord CDN. Thus if you want to attach something, send the attachment to Discord in its own message in any channel or DM and copy its link._

                        **end**
                        End a poll
                        *Parameters*
                        - \`message_id\` The poll message id.
                    `)
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            case "purge": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "Message deletion utility" })
                    .setTitle("/purge")
                    .setDescription("Purge messages in bulk from a channel.")
                    .addField("Parameters", `
                        - \`count\` The number of messages to remove.
                        - \`user-id\` Only remove messages sent by this user (optional).
                    `)
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            case "role-selection": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "Community role-selection" })
                    .setTitle("/role-selection")
                    .setDescription("Manage role selections. Give people the ability to customize their member profile!")
                    .addField("Subcommands 1/2", `‎
                        **create**
                        Create a new role selection message.
                        *Parameters*
                        - \`title\` The role selection title.
                        - \`description\` The role selection description.
                        - \`footer\` The role selection footer (optional).
                        - \`thumbnail_url\` The role selection thumbnail (optional).
                        - \`color\` The role selection message sidebar color (optional, hex).

                        **add-option**
                        Add a role selection option to a role selection message.
                        *Parameters*
                        - \`message_id\` The role selection message id.
                        - \`button_text\` The role selection button text.
                        - \`role_id\` The role to assign on button press.
                        ‎
                    `)
                    .addField("Subcommands 2/2", `‎
                        **remove-option**
                        Remove a role selection option from a role selection message.
                        *Parameters*
                        - \`message_id\` The role selection message id.
                        - \`role_id\` The role id of the added role selection option.

                        **remove**
                        Remove a role selection.
                        - \`message_id\` The role selection message id.
                    `)
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            case "info": {
                const embed = new PatchedMessageEmbed()
                    .setAuthor({ name: "Configuration inspection utility" })
                    .setTitle("/info")
                    .setDescription("Get the active bot configuration.")
                    .addField("Parameters", "*none*")
                    .setColor("#667bc4")
                interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                })
                break
            }
            default: {
                interaction.followUp({
                    content: "Unknown command.",
                    ephemeral: true
                })
            }
            }
        } else {
            // Default help message
            const embed = new PatchedMessageEmbed()
                .setTitle("Help & FAQ")
                .setDescription("What you can do with this bot application and some frequently asked questions about it!")
                .addField("Commands", "```/configure-access\n/poll\n/ctfd\n/purge\n/role-selection\n/info```", true)
                .addField("Required permissions", "- `Manage roles`\n- `Send messages`\n- `Application commands`", true)
                .addField("Core features", "This bot implements a CTFd integration (via `/ctfd`) with notifications about new challenges and solves along with some neat community management tools.")
                .addField("How to use", "You can always check this message again with `/help` and learn more about specific commands by using `/help <command>`.")
                .setFooter({ text: "I'm open source (MIT) on Github!" })
                .setAuthor({ name: `Testausserveri/challenge-fi-bot \`v${version}\`` })
                .setColor("#667bc4")
            const button =
                new MessageActionRow().addComponents(
                    new MessageButton({
                        style: "LINK",
                        url: "https://github.com/testausserveri/challenge-fi-bot",
                        label: "Github repository"
                    })
                )
            interaction.followUp({
                embeds: [embed],
                components: [button],
                ephemeral: true
            })
        }
    } else {
        next()
    }
}
