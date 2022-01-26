/* eslint-disable brace-style */
/* eslint-disable no-param-reassign */
// eslint-disable-next-line no-unused-vars
const { Interaction } = require("discord.js")
const checkForAccess = require("../utils/check_for_access")

/**
 * Purge messages from a channel
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isCommand() && interaction.commandName === "purge") {
        // Check for access
        if (!(await checkForAccess(interaction))) {
            interaction.reply({
                content: "Permission denied.",
                ephemeral: true
            })
            return
        }

        // The 500 messages at once maximum is not required,
        // but a measure to avoid API rate limiting
        const messageDeleteCount = parseInt(interaction.options.get("count").value, 10)
        const userId = interaction.options.get("user-id").value
        if (messageDeleteCount < 500) {
            await interaction.deferReply({
                ephemeral: true
            })
            // TODO: Resolve all messages, then delete them
            const messagesToDelete = []
            const remove = async (count) => {
                // eslint-disable-next-line no-param-reassign
                count -= 100
                let limit = 100
                if (count < 0) limit = 100 - Math.abs(count)
                const messages = await interaction.channel.messages.fetch({ limit })
                // eslint-disable-next-line no-restricted-syntax
                for (const message of messages) {
                    if (userId) {
                        if (message[1].author.id === userId && message[1].deletable) messagesToDelete.push(message[1])
                        else count += 1
                    } else if (message[1].deletable) messagesToDelete.push(message[1])
                    else count += 1
                }
                if (count > 0) await remove(count)
            }
            await remove(messageDeleteCount)
            // eslint-disable-next-line no-restricted-syntax
            for await (const message of messagesToDelete) {
                try { await message.delete() }
                // TODO: Handle this better?
                // eslint-disable-next-line no-empty
                catch (_) {}
            }
            interaction.followUp({
                content: `${messageDeleteCount} messages removed.`,
                ephemeral: true
            })
        } else {
            interaction.reply({
                content: "You are trying to delete too many messages (max 500).",
                ephemeral: true
            })
        }
    } else {
        next()
    }
}
