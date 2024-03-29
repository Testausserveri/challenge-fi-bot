// eslint-disable-next-line no-unused-vars
const { Interaction } = require("discord.js")
const { createHash } = require("crypto")
const { performance } = require("perf_hooks")
const findMessage = require("../utils/find_message")
const checkForAccess = require("../utils/check_for_access")
const PatchedMessageEmbed = require("../utils/message_embed_patch")
const request = require("../utils/request")

/**
 * Some module
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isCommand() && interaction.commandName === "info") {
        if (!(await checkForAccess(interaction))) {
            interaction.reply({
                content: "Permission denied.",
                ephemeral: true
            })
            return
        }
        await interaction.deferReply({
            ephemeral: true
        })

        let canTimeout = true
        let timedOut = false
        setTimeout(() => {
            if (!canTimeout) return
            timedOut = true
            interaction.followUp({
                content: "The execution of `/info` is taking longer than expected. Progress updates on command execution will be sent to you. Please wait...",
                ephemeral: true
            })
        }, 5000)

        const atExecution = performance.now()

        const roleSelection = await global.schemas.RoleSelectionModel.find({ id: interaction.guild.id }).exec()
        const polls = await global.schemas.PollModel.find({ id: interaction.guild.id }).exec()
        const accessConfig = await global.schemas.ServerAccessModel.findOne({ id: interaction.guild.id }).exec()
        let ctfdIntegration = await global.schemas.CTFdIntegrationModel.findOne({ id: interaction.guild.id }).exec()
        if (ctfdIntegration === null) ctfdIntegration = {}

        const atQueryComplete = performance.now()
        const queryTimeTaken = atQueryComplete - atExecution

        if (timedOut) { // Progress message for database related slowness
            interaction.followUp({
                content: "Database queries completed. Resolving message locations...",
                ephemeral: true
            })
        }

        // eslint-disable-next-line max-len
        const roleSelectionData = roleSelection.length !== 0 ? (await Promise.all(roleSelection.map(async (document) => (await findMessage(document.message, interaction.guild))?.url ?? `invalid-message \`id: ${document.message}\``))).join(", ") : "none"
        const pollData = polls.length !== 0 ? (await Promise.all(polls.map(async (document) => (await findMessage(document.message, interaction.guild))?.url ?? `invalid-message \`id: ${document.message}\``))).join(" ") : "none"

        const afterMessageQuery = performance.now()
        const messageQueryTimeTaken = afterMessageQuery - atQueryComplete

        if (timedOut) { // Progress message for message resolving related slowness
            interaction.followUp({
                content: "Message locations resolved. Testing CTFd host (if configured)...",
                ephemeral: true
            })
        }

        // Test CTFd host availability
        let ctfdHostAvailability = "Unknown"
        let hostTestTimeTaken = "Unknown"
        if (Object.keys(ctfdIntegration).length > 0) {
            const beforeHostTest = performance.now()
            try {
                const challengeTest = await request("GET", `${ctfdIntegration.apiUrl}api/v1/challenges`, {
                    "Content-Type": "application/json",
                    Authorization: `Token ${ctfdIntegration.apiToken}`
                })
                hostTestTimeTaken = performance.now() - beforeHostTest
                if (challengeTest.status === 200) {
                    ctfdHostAvailability = "Operational"
                } else {
                    ctfdHostAvailability = "Degraded/Outage"
                }
            } catch (e) {
                ctfdHostAvailability = "Error/Unavailable"
                console.error("Unable to resolve ctfd host status", e)
            }
        }

        if (timedOut) { // Progress message for CTFd test related slowness
            interaction.followUp({
                content: "CTFd host test complete. Building summary...",
                ephemeral: true
            })
        }

        const embed = new PatchedMessageEmbed()
            .setAuthor({ name: "Server configuration" })
            .setTitle(interaction.guild.name)
            .setColor("#667bc4")
            .setThumbnail(interaction.guild.iconURL())
            .addField("Authorized role", `
                Role: ${accessConfig !== null ? `<@&${accessConfig.role}>` : "none"}
            `)
            .addField("Role selection(s)", `
                Messages: ${roleSelectionData}
            `)
            .addField("Poll(s)", `
                Messages: ${pollData}
            `)
            .addField("CTFd integration", `
                CTFd API URL: \`${ctfdIntegration.apiUrl ?? "none"}\`
                CTFd API Token SHA256 hash: \`${ctfdIntegration.apiToken !== null && ctfdIntegration.apiToken !== undefined ? createHash("sha256").update(ctfdIntegration.apiToken).digest("hex") : "none"}\`
                CTFd challenge notification channel: <#${ctfdIntegration.challengeNotifications ?? "none"}>
                CTFd solve notification channel: <#${ctfdIntegration.solveNotifications ?? "none"}>
                Host status: \`${ctfdHostAvailability}\`
            `)
            .addField("Performance", `
                \`\`\`
                Ping:               ~${Math.round(global.client.ws.ping)} ms
                Database:           ~${Math.round(queryTimeTaken)} ms
                Message queries:    ~${Math.round(messageQueryTimeTaken)} ms
                CTFd host:          ~${Math.round(hostTestTimeTaken)} ms*
                \`\`\`
                Total: \`~${Math.round(afterMessageQuery - atExecution + global.client.ws.ping)}\` ms
                
                _* Not included in total response time calculation._
            `)
        canTimeout = false
        interaction.followUp({
            ephemeral: true,
            embeds: [embed]
        })
    } else {
        next()
    }
}
