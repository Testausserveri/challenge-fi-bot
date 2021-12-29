// eslint-disable-next-line no-unused-vars
const { Interaction } = require("discord.js")

/**
 * Display a loading animation as a slash command response
 * @param {Interaction} interaction
 * @returns {Promise<void>}
 */
module.exports = async (interaction) => {
    // No support for this yet in the official library.
    // It displays 3 loading dots.
    interaction.replied = true
    await global.client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 5,
            data: {
                flags: 64
            }
        }
    })
}
