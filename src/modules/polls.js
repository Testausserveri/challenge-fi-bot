const {
    // eslint-disable-next-line no-unused-vars
    Interaction,
    // eslint-disable-next-line no-unused-vars
    TextChannel,
    MessageAttachment,
    // eslint-disable-next-line no-unused-vars
    Message,
    MessageActionRow,
    MessageButton
} = require("discord.js")
const PatchedMessageEmbed = require("../utils/message_embed_patch")
const request = require("../utils/request")
const findMessage = require("../utils/find_message")
const checkForAccess = require("../utils/check_for_access")

/**
 * Convert a number into an emoji. The world that we live in nowadays... :p
 * @param {Number} number
 * @param {Boolean} asObject Get output as a Discord.js emoji
 * @returns {String}
 */
function numberToEmoji(number, asObject) {
    const table = {
        0: "0️⃣",
        1: "1️⃣",
        2: "2️⃣",
        3: "3️⃣",
        4: "4️⃣",
        5: "5️⃣",
        6: "6️⃣",
        7: "7️⃣",
        8: "8️⃣",
        9: "9️⃣"
    }
    if (!asObject) return number.toString().split("").map((digit) => table[digit]).join("")
    return number.toString().split("").map((digit) => ({ name: table[digit] }))
}

/**
 * Generate button components from a list
 * @param {Object} list The button configuration
 * @returns {MessageActionRow[]}
 */
function generateButtonComponents(list, replaceLabel) {
    const components = []
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(list)) {
        components.push(new MessageButton()
            .setStyle("SECONDARY")
            .setLabel(replaceLabel ?? list[key])
            .setEmoji(numberToEmoji(key).replace(/:/g, ""))
            .setCustomId(key))
    }
    const actionRows = [new MessageActionRow()]
    // eslint-disable-next-line no-restricted-syntax
    for (const component of components) {
        let currentRow = actionRows[actionRows.length - 1]
        if (currentRow.components.length >= 5) {
            actionRows.push(new MessageActionRow())
            currentRow = actionRows[actionRows.length - 1]
        }
        currentRow.addComponents(component)
    }
    return actionRows
}

/**
 * Create a poll embed
 * @param {String} title The embed title
 * @param {String} description The embed description
 * @param {String} image The embed thumbnail
 * @param {Object} options The list of poll options
 * @param {Number} end The Unix time the poll will end at
 * @param {TextChannel} channel The channel the poll is taking place in
 * @returns {Promise<Message>}
 */
async function createPoll(title, description, image, color, options, end, channel) {
    const embed = new PatchedMessageEmbed({ title, description })
    let thumbnailAttachment = null
    if (image) {
        thumbnailAttachment = new MessageAttachment(new Buffer.from(image, "base64"), "thumbnail.png")
        embed.setThumbnail("attachment://thumbnail.png")
    }
    if (color) embed.setColor(color)
    embed.addField("Options", `‎\n${Object.keys(options).map((key) => `**${numberToEmoji(key)}** ${options[key]}`).join("\n\n")}\n\n**Click the buttons below to vote!**`)
    const endDate = new Date()
    endDate.setTime(end)
    embed.setFooter("This poll will end")
    embed.setTimestamp(endDate)
    embed.setAuthor("Poll")
    const msg = await channel.send({ embeds: [embed], components: generateButtonComponents(options, "0"), files: thumbnailAttachment !== null ? [thumbnailAttachment] : undefined })
    return msg
}

/**
 * End a poll
 * @param {Message} message
 * @param {Object} document
 * @returns {Promise<Message<boolean>>}
 */
async function endPoll(message, document) {
    message.embeds[0].fields[0].name = "Results"
    const winner = Object.keys(document.votes).sort((a, b) => document.votes[a].length - document.votes[b].length).reverse()[0]
    // eslint-disable-next-line max-len
    message.embeds[0].fields[0].value = `‎\n${Object.keys(document.options).map((key) => `\`[ ${document.votes[key].length} ]\` **${numberToEmoji(key)}** ${document.options[key]}`).join("\n\n")}\n\n**Most votes:** \`${winner} ${document.options[winner]}\``
    message.embeds[0].fields = [message.embeds[0].fields[0]]
    message.embeds[0].setFooter("Poll ended.")
    message.embeds[0].timestamp = null
    return message.edit({
        embeds: [message.embeds[0]], files: [], attachments: [], components: []
    })
}

// Check for polls to be closed & update vote counts
if (global.discordPollUpdatedInterval < 5000) console.warn("The Discord poll-message update polling interval is too low! Rate-limiting might occur!")
setInterval(async () => {
    // eslint-disable-next-line no-restricted-syntax
    for await (const document of global.schemas.PollModel.find()) {
        const message = await findMessage(document.message, (await global.client.guilds.fetch(document.id)))
        if (message === null) {
            // Expired, remove it
            await global.schemas.PollModel.findOneAndRemove({ id: document.id, message: document.message })
            return
        }
        // Do we end the poll?
        if (document.end <= new Date().getTime()) {
            let doRetry = true
            try {
                await endPoll(message, document) // This should throw and not update the database if this fails
                doRetry = false
                await global.schemas.PollModel.findOneAndRemove({ id: document.id, message: document.message })
            } catch (err) {
                // Try deletion once more
                if (!doRetry) await global.schemas.PollModel.findOneAndRemove({ id: document.id, message: document.message })
            }
            return
        }
        const buttonData = Object.fromEntries(Object.keys(document.votes).map((key) => [key, document.votes[key].length.toString()]))
        // Update message vote counts
        const oldValue = Object.fromEntries(message.components[0].components.map((button) => [button.customId, button.label]))
        if (buttonData !== oldValue) {
            message.edit({ components: generateButtonComponents(buttonData) })
        }
    }
}, global.discordPollUpdatedInterval)

/**
 * Poll module
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isButton()) {
        // Handle button click
        const option = interaction.customId
        const poll = await global.schemas.PollModel.findOne({ message: interaction.message.id, id: interaction.guild.id }).exec()
        if (poll === null) {
            // This is not a poll button click
            next()
            return
        }
        if (!interaction.replied) await interaction.deferReply({ ephemeral: true })
        const votedBefore = Object.keys(poll.votes).filter((baseOption) => poll.votes[baseOption].includes(interaction.user.id))
        let lastVote = ""
        if (votedBefore.length !== 0) {
            // Remove the vote
            poll.votes[votedBefore[0]].splice(poll.votes[votedBefore[0]].indexOf(interaction.user.id), 1)
            lastVote = `*(Vote for \`${votedBefore[0]}\` removed)*`
        }
        // Add a vote
        poll.votes[option].push(interaction.user.id)
        await global.schemas.PollModel.findOneAndUpdate({ message: interaction.message.id, id: interaction.guild.id }, { $set: { votes: poll.votes } }).exec()
        interaction.followUp({
            content: `✅ Your vote for \`${option}\` was confirmed. ${lastVote}`,
            ephemeral: true
        })
    } else if (interaction.isCommand()) {
        // Handle slash command
        // eslint-disable-next-line no-lonely-if
        if (interaction.commandName === "poll") {
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
                let title; let description; let image; let color; let options; let
                    end = null
                const votesTemplate = {}
                await interaction.deferReply({
                    ephemeral: true
                })
                // Get input options
                // TODO: A better way to do this?
                // eslint-disable-next-line no-restricted-syntax
                for await (const option of interaction.options.data[0].options) {
                    // eslint-disable-next-line default-case
                    switch (option.name) {
                    case "title": {
                        title = option.value
                        break
                    }
                    case "description": {
                        description = option.value.replace("\\n", "\n")
                        break
                    }
                    case "color": {
                        color = /^#([0-9a-f]{3}){1,2}$/i.test(option.value) ? option.value : null
                        break
                    }
                    case "thumbnail_url": {
                        // This is more complex, download the image with a get from the URL and convert to base 64
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
                        break
                    }
                    case "duration": {
                        let format = option.value.split(" ")[1]
                        if (format.endsWith("s")) format = format.split("").splice(0, format.length - 1).join("")
                        const multiplier = parseInt(option.value.split(" ")[0], 10)
                        let time = null
                        // eslint-disable-next-line default-case
                        switch (format) {
                        case "day": {
                            time = multiplier * 86400000
                            break
                        }
                        case "hour": {
                            time = multiplier * 3600000
                            break
                        }
                        case "minute": {
                            time = multiplier * 60000
                            break
                        }
                        case "second": {
                            time = multiplier * 1000
                        }
                        }
                        end = (new Date().getTime() + time).toString()
                        break
                    }
                    case "options": {
                        const optionsArray = option.value.split(";")
                        if (optionsArray[0] === "") optionsArray.splice(0, 1) // Remove ghost option (dunno why this appears, but this fixes that)
                        options = {}
                        // eslint-disable-next-line no-plusplus
                        for (let i = 0; i < optionsArray.length; i++) {
                            options[`${(i + 1).toString()}.`] = optionsArray[i]
                            votesTemplate[`${(i + 1).toString()}.`] = []
                        }
                        break
                    }
                    }
                }
                if (image === false) { // Image download failed
                    interaction.followUp({
                        content: "Failed to download image. (Only PNGs and urls from Discord's CDNs are allowed!)",
                        ephemeral: true
                    })
                } else {
                    try {
                        const msg = await createPoll(title, description, image, color, options, end, interaction.channel)
                        await global.schemas.PollModel.findOneAndUpdate(
                            { id: interaction.guild.id, message: msg.id },
                            {
                                id: interaction.guild.id,
                                embed: {
                                    title,
                                    description,
                                    image
                                },
                                message: msg.id,
                                end,
                                options,
                                votes: votesTemplate
                            },
                            { upsert: true }
                        ).exec().then(() => {
                            interaction.followUp({
                                content: `Poll created. Id: \`${msg.id}\``,
                                ephemeral: true
                            })
                        }).catch(() => {
                            if (msg.deletable) msg.delete()
                            interaction.followUp({
                                content: "Database error.",
                                ephemeral: true
                            })
                        })
                    } catch (e) {
                        interaction.followUp({
                            content: "Failed to create poll message.",
                            ephemeral: true
                        })
                    }
                }
            } else if (interaction.options.getSubcommand() === "end") {
                await interaction.deferReply({
                    ephemeral: true
                })
                const messageId = interaction.options.get("message_id")?.value
                const poll = await global.schemas.PollModel.findOne({ id: interaction.guild.id, message: messageId }).exec()
                console.log(poll)
                if (poll !== null) {
                    const message = await findMessage(messageId, interaction.guild)
                    await endPoll(message, poll)
                    await global.schemas.PollModel.findOneAndRemove({ id: interaction.guild.id, message: messageId }).exec()
                    interaction.followUp({
                        content: `Poll \`${messageId}\` closed.`,
                        ephemeral: true
                    })
                } else {
                    interaction.followUp({
                        content: "No such poll exists.",
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
