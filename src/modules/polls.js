const { Interaction, TextChannel, MessageEmbed, MessageAttachment, Message, MessageActionRow, MessageButton } = require("discord.js")
const request = require("../utils/request.js")
const findMessage = require("../utils/find_message.js")
const check_for_access = require("../utils/check_for_access.js")

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
async function createPoll(title, description, image, color, options, end, channel){
    const embed = new MessageEmbed({ title, description })
    let thumbnailAttachment = null
    if(image !== null){
        thumbnailAttachment = new MessageAttachment(new Buffer.from(image, "base64"), "thumbnail.png")
        embed.setThumbnail("attachment://thumbnail.png")
    }
    if(color !== null) embed.setColor(color)
    embed.addField("Options", Object.keys(options).map(key => `\`[ 0 ]\` – **${key}** ${options[key]}`).join("\n"))
    const endDate = new Date()
    endDate.setTime(end)
    embed.setFooter("This poll will end")
    embed.setTimestamp(endDate)
    embed.addField("How to vote?", "Click the buttons below to vote.")
    const buttons = new MessageActionRow().addComponents(...generateButtonComponents(options))
    const msg = await channel.send({ embeds: [embed], components: [buttons], files: thumbnailAttachment !== null ? [thumbnailAttachment] : undefined })
    return msg
}

/**
 * Generate button components from a list
 * @param {Object} list Button configuration list
 * @returns {MessageButton[]}
 */
function generateButtonComponents(list){
    let components = []
    for(const key of Object.keys(list)){
        components.push(new MessageButton()
            .setStyle("PRIMARY")
            .setLabel(key)
            .setCustomId(key)
        )
    }
    return components
}

/**
 * End a poll
 * @param {Message} message
 * @param {Object} document
 * @returns {Promise<void>}
 */
async function endPoll(message, document){
    message.embeds[0].fields[0].name = "Results"
    const winner = Object.keys(document.votes).sort((a, b) => a.length - b.length)
    message.embeds[0].fields[0].value = Object.keys(document.options).map(key => "`[ " + document.votes[key].length + " ]` – **" + key + "** " + document.options[key]).join("\n") + "\n\n**Most votes:** `" + winner[0] + " " + document.options[winner[0]] + "`"
    message.embeds[0].fields = [message.embeds[0].fields[0]]
    message.embeds[0].setFooter("Poll ended.")
    message.embeds[0].timestamp = null
    message.edit({ embeds: [message.embeds[0]], files: [], attachments: [], components: [] })
}

// Check for polls to be closed & update vote counts
setInterval(async () => {
    for await (const document of global.schemas.PollModel.find()){
        const message = await findMessage(document.message, await global.client.guilds.fetch(document.id))
        
        if(message === null){
            // Expired, remove it
            await global.schemas.PollModel.findOneAndRemove({ id: document.id, message: document.message })
            return
        }
        // Do we end the poll?
        if(document.end <= new Date().getTime()){
            await global.schemas.PollModel.findOneAndRemove({ id: document.id, message: document.message })
            await endPoll(message, document)
            return
        }
        // Update message vote counts
        const newValue = Object.keys(document.options).map(key => "`[ " + document.votes[key].length + " ]` – **" + key + "** " + document.options[key]).join("\n")
        if(message.embeds[0].fields[0].value !== newValue){
            message.embeds[0].fields[0].value = newValue
            message.edit({ embeds: message.embeds, files: [], attachments: [] })
        }
    }
}, 5000)

/**
 * Poll module
 */
module.exports = {
    /**
     * Handle interactionCreate event
     * @param {Interaction} interaction 
     * @returns {Promise<void>}
     */
    interactionCreate: async interaction => {
        if(interaction.commandName === "poll"){
            // Check for access
            if(!check_for_access(interaction)){
                interaction.reply({
                    content: "Permission denied.",
                    ephemeral: true
                })
                return
            }

            // Handle application commands
            if(interaction.options._subcommand === "create"){
                let title, description, image, color, options, end = null
                let votesTemplate = {}
                interaction.reply({
                    content: "Creating poll...",
                    ephemeral: true
                })
                // Get input options
                for(const option of interaction.options._hoistedOptions){
                    switch(option.name){
                        case "title": {
                            title = option.value
                            break
                        }
                        case "description": {
                            description = option.value
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
                                if(global.whitelistedHosts.includes(url.host)){
                                    const imageRequest = await request("GET", option.value, {}, null)
                                    if(imageRequest.status === 200){
                                        image = imageRequest.data.toString("base64")
                                    }else {
                                        image = false
                                    }
                                }else {
                                    image = false
                                }
                            }
                            catch(_){
                                image = false
                            }
                            break
                        }
                        case "duration": {
                            let format = option.value.split(" ")[1]
                            if(format.endsWith("s")) format = format.split("").splice(0, format.length - 1).join("")
                            const multiplier = parseInt(option.value.split(" ")[0])
                            let time = null
                            switch(format){
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
                            console.log(multiplier, format, time)
                            end = (new Date().getTime() + time).toString()
                            break
                        }
                        case "options": {
                            let optionsArray = option.value.split(";").sort()
                            if(optionsArray[0] === "") optionsArray.splice(0, 1) // Remove ghost option (dunno why this appears, but this fixes that)
                            options = {}
                            for(let i = 0; i < optionsArray.length; i++){
                                options[(i + 1).toString() + "."] = optionsArray[i]
                                votesTemplate[(i + 1).toString() + "."] = []
                            }
                            break
                        }
                    }
                }
                if(image === false){ // Image download failed
                    interaction.followUp({
                        content: "Failed to download image. (Only PNGs and urls from Discord's CDNs are allowed!)",
                        ephemeral: true
                    })
                }else {
                    const msg = await createPoll(title, description, image, color, options, end, interaction.channel)
                    global.schemas.PollModel.findOneAndUpdate(
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
                            content: "Poll created. Id: `" + msg.id + "`",
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
            }else if(interaction.options._subcommand === "end"){
                const messageId = interaction.options._hoistedOptions.filter(option => option.name === "message_id")[0].value
                const poll = await global.schemas.PollModel.findOne({ id: interaction.guild.id, message: messageId }).exec()
                if(poll !== null){
                    const message = await findMessage(messageId, interaction.guild)
                    await endPoll(message, poll)
                    await global.schemas.PollModel.findOneAndRemove({ id: interaction.guild.id, message: messageId }).exec()
                    interaction.reply({
                        content: "Poll `" + messageId + "` closed.",
                        ephemeral: true
                    })
                }else {
                    interaction.reply({
                        content: "No such poll exists.",
                        ephemeral: true
                    })
                }
            }
        }
    },
    /**
     * Handle button clicks
     * @param {Interaction} interaction 
     */
    clickButton: async interaction => {
        const option = interaction.customId
        const poll = await global.schemas.PollModel.findOne({ message: interaction.message.id, id: interaction.guild.id }).exec()
        if(poll === null) return
        // Has the user voted?
        const votedBefore = Object.keys(poll.votes).filter(option => poll.votes[option].includes(interaction.user.id))
        let lastVote = ""
        if(votedBefore.length !== 0){
            // Remove the vote
            poll.votes[votedBefore[0]].splice(poll.votes[votedBefore[0]].indexOf(interaction.user.id), 1)
            lastVote = "*(Vote for `" + votedBefore[0] + "` removed)*"
        }
        // Add a vote
        poll.votes[option].push(interaction.user.id)
        await global.schemas.PollModel.findOneAndUpdate({ message: interaction.message.id, id: interaction.guild.id }, { $set: { votes: poll.votes }}).exec()
        interaction.reply({
            content: `✅ Your vote for \`${option}\` was confirmed ${lastVote}.`,
            ephemeral: true
        })
    }
}