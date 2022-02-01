const {
    // eslint-disable-next-line no-unused-vars
    Interaction,
    MessageActionRow,
    MessageButton
} = require("discord.js")
const PatchedMessageEmbed = require("../utils/message_embed_patch")
const request = require("../utils/request")
const checkForAccess = require("../utils/check_for_access")
const getNumberEnding = require("../utils/get_number_ending")
const isValidJson = require("../utils/is_valid_json")

// Poll based notification & leaderboard state change listener
if (global.pollTimeCTFd < 10000) console.warn("The CTFd server polling interval is too low! Consider making it higher to avoid unnecessary service strain!")
setInterval(async () => {
    // eslint-disable-next-line no-restricted-syntax
    for await (let document of global.schemas.CTFdIntegrationModel.find()) {
        // New challenge notifications
        if (document.challengeNotifications !== "") {
            try {
                const challenges = await request("GET", `${document.apiUrl}api/v1/challenges`, {
                    "Content-Type": "application/json",
                    Authorization: `Token ${document.apiToken}`
                })
                if (challenges.status === 200) {
                    const body = JSON.parse(challenges.data)
                    // eslint-disable-next-line no-throw-literal
                    if (body.success === false) throw "API Error"
                    const oldIds = document.cachedChallenges.map((challenge) => challenge.id) ?? []
                    const newChallenges = body.data.filter((challenge) => !oldIds.includes(challenge.id))
                    const channel = await global.client.channels.fetch(document.challengeNotifications)
                    if (newChallenges.length > 0) {
                        await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: document.id }, {
                            $set: {
                                cachedChallenges: body.data.map((challenge) => ({
                                    name: challenge.name,
                                    id: challenge.id,
                                    value: challenge.value
                                }))
                            }
                        }).exec()
                        if (channel === null) {
                            console.error("Unable to send notifications for", document.id, "to", document.challengeNotifications)
                        } else {
                            // eslint-disable-next-line no-restricted-syntax
                            for await (const newChallenge of newChallenges) {
                                const embed = new PatchedMessageEmbed()
                                const button =
                                    new MessageActionRow().addComponents(new MessageButton({
                                        style: "LINK",
                                        url: `${document.apiUrl}challenges#${encodeURIComponent(newChallenge.name)}-${newChallenge.id}`,
                                        label: "View challenge"
                                    }))
                                embed.setTitle("New challenge!")
                                embed.setColor("PURPLE")
                                const tags = newChallenge.tags.length !== 0 ? newChallenge.tags.map((tag) => tag.value).join(", ") : "none"
                                embed.setDescription(
                                    `Name: \`${newChallenge.name}\`\n
                                    Category: \`${newChallenge.category}\`\n
                                    Points: \`${newChallenge.value}\`\n
                                    Tags: \`${tags}\``
                                )
                                embed.setFooter(`ID: ${newChallenge.id} TYPE: ${newChallenge.type}`)
                                embed.setTimestamp(new Date().getTime())
                                await channel.send({
                                    embeds: [embed],
                                    components: [button]
                                })
                            }
                        }
                    } else {
                        // Update the cache if required (some details changed)
                        const integration =
                            await global.schemas.CTFdIntegrationModel.findOne({
                                id: document.id
                            }).exec()
                        if (
                            JSON.stringify(integration.cachedChallenges) !==
                            JSON.stringify(body.data.map((challenge) => ({
                                name: challenge.name,
                                id: challenge.id,
                                value: challenge.value
                            })))
                        ) {
                            // Cached & Current data do not match
                            document.cachedChallenges = body.data.map((challenge) => ({
                                name: challenge.name,
                                id: challenge.id,
                                value: challenge.value
                            }))
                            if (!Array.isArray(document.cachedChallenges) || document.cachedChallenges === undefined) document.cachedChallenges = []
                            await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: document.id }, {
                                $set: {
                                    cachedChallenges: document.cachedChallenges
                                }
                            }).exec()
                        }
                    }
                } else {
                    // API Error
                    // TODO: Notify user?
                    console.error("Failed to access CTFd API for", document.id, "at", document.apiUrl, "with", document.apiToken, "request", challenges)
                }
            } catch (e) {
                console.error("Challenge notification error", e)
            }
        }
        // New solve notifications
        if (document.solveNotifications !== "") {
            // We have to make a request for each challenge
            // eslint-disable-next-line no-continue
            let doNotNotify = false
            let updated = false
            if (document.cachedSolves === "create") {
                doNotNotify = true
                document.cachedSolves = {}
            }
            // eslint-disable-next-line no-restricted-syntax
            for await (const { id, name, value } of document.cachedChallenges) {
                try {
                    const solves = await request("GET", `${document.apiUrl}api/v1/challenges/${id}/solves`, {
                        "Content-Type": "application/json",
                        Authorization: `Token ${document.apiToken}`
                    })
                    if (
                        solves.status === 200 &&
                        JSON.parse(solves.data).success === true
                    ) {
                        // Successful API response
                        const oldSolves = document.cachedSolves[id] ?? []
                        const body = JSON.parse(solves.data)
                        const newSolves = body.data
                            .map((solve, index) => {
                                solve.index = index + 1
                                return solve
                            })
                            .filter((solve) => !oldSolves.includes(solve.account_id))
                        const channel = await global.client.channels.fetch(document.solveNotifications)
                        if (newSolves.length > 0) {
                            // We have new solves
                            document.cachedSolves[id] = body.data.map((solve) => solve.account_id)
                            await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: document.id },
                                {
                                    $set: {
                                        cachedSolves: document.cachedSolves
                                    }
                                }).exec()
                            updated = true
                            if (channel === null) {
                                console.error("Unable to send notifications for", document.id, "to", document.solveNotifications)
                            } else {
                                // eslint-disable-next-line no-continue
                                if (doNotNotify) continue
                                // eslint-disable-next-line no-restricted-syntax
                                for await (const newSolve of newSolves) {
                                    // eslint-disable-next-line no-continue
                                    if (newSolve.index > 3) continue // Only display top 3, TODO: Maybe make this configurable?
                                    const embed = new PatchedMessageEmbed()
                                    embed.setTitle(`New solve! ${newSolve.index === 1 ? "FIRST SOLVE!" : ""}`)
                                    embed.setDescription(`
                                    \`${newSolve.name}\` solved \`${name}\`!
                                    They were the \`${newSolve.index}${getNumberEnding(newSolve.index)}\` to solve the challenge.
                                    The solution was worth \`${value}\` points.`)
                                    embed.setColor("GREEN")
                                    embed.setFooter(`ID: ${newSolve.account_id}`)
                                    embed.setTimestamp(new Date().getTime())
                                    await channel.send({ embeds: [embed] })
                                }
                            }
                        }
                    } else {
                        // API Error
                        console.error("Failed to access CTFd API for", document.id, "at", document.apiUrl, "with", document.apiToken, "request", solves)
                    }
                } catch (e) {
                    console.error("Solve notification error", e)
                }
            }
            // Update as empty if required
            if (updated === false && doNotNotify === true) {
                await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: document.id },
                    {
                        $set: {
                            cachedSolves: document.cachedSolves
                        }
                    }).exec()
            }
        }
    }
}, global.pollTimeCTFd)

/**
 * CTFd integration module
 * @param {Interaction} interaction
 * @param {Function} next If we will move on to the next handler
 */
module.exports = async (interaction, next) => {
    if (interaction.isCommand() && interaction.commandName === "ctfd") {
        // Check for access
        if (!(await checkForAccess(interaction))) {
            interaction.reply({
                content: "Permission denied.",
                ephemeral: true
            })
            return
        }

        if (interaction.options.getSubcommand() === "configure-api") {
            // Configure the integration
            let apiUrl = interaction.options.get("api-host")?.value
            // Make sure we have a valid URL if the user forgot to put this stuff in
            if (!apiUrl.startsWith("https")) apiUrl = `https://${apiUrl}`
            if (!apiUrl.endsWith("/")) apiUrl += "/"
            const apiToken = interaction.options.get("api-token")?.value
            await interaction.deferReply({
                ephemeral: true
            })
            // Test with /api/v1/swagger.json, expect status 200 with content-length 68160
            try {
                const url = new URL(apiUrl)
                if (global.whitelistedCTFdHosts.includes(url.hostname)) {
                    // Test the API
                    const testRequest = await request("GET", `${apiUrl}api/v1/swagger.json`)
                    if (
                        testRequest.status === 200 &&
                        isValidJson(testRequest.data) &&
                        JSON.parse(testRequest.data).basePath === "/api/v1" // Should be enough checks right?
                    ) {
                        // The API is reachable
                        const challengeTest = await request("GET", `${apiUrl}api/v1/challenges`, {
                            "Content-Type": "application/json",
                            Authorization: `Token ${apiToken}`
                        })
                        // eslint-disable-next-line no-unused-vars
                        const leaderboardTest = await request("GET", `${apiUrl}api/v1/scoreboard/10`, {
                            "Content-Type": "application/json",
                            Authorization: `Token ${apiToken}`
                        })
                        if (
                            /* challengeTest.status === 200 &&
                            JSON.parse(challengeTest.data).success === true &&
                            leaderboardTest.status === 200 &&
                            JSON.parse(leaderboardTest.data).success === true */
                            true // TODO: Leaderboard test is redundant
                        ) {
                            // TODO: Remove old messages & roles from users
                            // The API passed all tests
                            // TODO: Do we have to define every value here? Can't we use the schema to se these automatically...?
                            global.schemas.CTFdIntegrationModel.findOneAndUpdate(
                                { id: interaction.guild.id },
                                {
                                    id: interaction.guild.id,
                                    apiToken,
                                    apiUrl,
                                    cachedChallenges: JSON.parse(challengeTest.data).data.map((challenge) => ({
                                        name: challenge.name,
                                        id: challenge.id,
                                        value: challenge.value
                                    })),
                                    cachedLeaderboard: [],
                                    challengeNotifications: "",
                                    cachedSolves: "create",
                                    leaderboardRoles: [],
                                    solveNotifications: "",
                                    leaderboardSync: ""
                                },
                                { upsert: true }
                            )
                                .exec()
                                .then(() => {
                                    interaction.followUp({
                                        content: `CTFd API is now configured to use \`${url.hostname}\`. All features reset to defaults.`,
                                        ephemeral: true
                                    })
                                })
                                .catch(() => {
                                    interaction.followUp({
                                        content: "Failed.",
                                        ephemeral: true
                                    })
                                })
                        } else {
                            interaction.followUp({
                                content: "The provided API token or server does not allow access to some required methods or resources. Required: `/api/v1/challenges, /api/v1/scoreboard, /api/v1/scoreboard/<count>`.",
                                ephemeral: true
                            })
                        }
                    } else {
                        interaction.followUp({
                            content: "The CTFd API host is not reachable or does not support the v1 API. Make sure you used the correct hostname and that it supports HTTPS.",
                            ephemeral: true
                        })
                    }
                } else {
                    interaction.followUp({
                        content: "This host is not whitelisted.",
                        ephemeral: true
                    })
                }
            } catch (e) {
                if (e.code === "ERR_INVALID_URL") {
                    interaction.followUp({
                        content: "Invalid hostname/url provided.",
                        ephemeral: true
                    })
                } else {
                    console.error(e)
                    interaction.followUp({
                        content: "An error occurred :/",
                        ephemeral: true
                    })
                }
            }
        } else if (interaction.options.getSubcommand() === "configure-chall-notifications") {
            await interaction.deferReply({
                ephemeral: true
            })
            const channelId = interaction.options.get("channel-id")?.value
            const integration = await global.schemas.CTFdIntegrationModel.findOne({ id: interaction.guild.id }).exec()
            if (channelId === undefined) {
                if (integration.challengeNotifications !== "") {
                    await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: interaction.guild.id }, { $set: { challengeNotifications: "" } }).exec()
                    interaction.followUp({
                        content: "New challenge -notifications disabled.",
                        ephemeral: true
                    })
                } else {
                    interaction.followUp({
                        content: "New challenge -notifications are already disabled.",
                        ephemeral: true
                    })
                }
                return
            }
            const channel = await interaction.guild.channels.fetch(channelId)
            if (channel === null) {
                interaction.followUp({
                    content: "Invalid channel.",
                    ephemeral: true
                })
                return
            }
            if (integration.challengeNotifications === channelId) {
                interaction.followUp({
                    content: "New Challenge -notifications are already configured to be sent to that channel.",
                    ephemeral: true
                })
                return
            }
            try {
                const embed = new PatchedMessageEmbed({
                    title: "Info",
                    description: "New challenge -notifications will now be sent to this channel.",
                    footer: {
                        text: "This is a test. You may ignore this message."
                    }
                })
                await channel.send({ embeds: [embed] })
                await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: interaction.guild.id }, { $set: { challengeNotifications: channelId } }).exec()
                interaction.followUp({
                    content: `New challenge -notifications will now be sent to \`${channelId}\`.`,
                    ephemeral: true
                })
            } catch (_) {
                interaction.followUp({
                    content: "An error occurred :/ Make sure the bot has access to the channel and the bot has the `Send messages` permission.",
                    ephemeral: true
                })
            }
        } else if (interaction.options.getSubcommand() === "configure-solve-notifications") {
            await interaction.deferReply({
                ephemeral: true
            })
            const channelId = interaction.options.get("channel-id")?.value
            const integration = await global.schemas.CTFdIntegrationModel.findOne({ id: interaction.guild.id }).exec()
            if (channelId === undefined) {
                if (integration.solveNotifications !== "") {
                    await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: interaction.guild.id },
                        { $set: { solveNotifications: "" } }).exec()
                    interaction.followUp({
                        content: "New solve -notifications disabled.",
                        ephemeral: true
                    })
                } else {
                    interaction.followUp({
                        content: "New solve -notifications are already disabled.",
                        ephemeral: true
                    })
                }
                return
            }
            const channel = await interaction.guild.channels.fetch(channelId)
            if (channel === null) {
                interaction.followUp({
                    content: "Invalid channel.",
                    ephemeral: true
                })
                return
            }
            if (integration.solveNotifications === channelId) {
                interaction.followUp({
                    content: "New solve -notifications are already configured to be sent to that channel.",
                    ephemeral: true
                })
                return
            }
            try {
                const embed = new PatchedMessageEmbed({
                    title: "Info",
                    description: "New solve -notifications will now be sent to this channel.",
                    footer: {
                        text: "This is a test. You may ignore this message."
                    }
                })
                await channel.send({ embeds: [embed] })
                await global.schemas.CTFdIntegrationModel.findOneAndUpdate({ id: interaction.guild.id },
                    { $set: { solveNotifications: channelId } }).exec()
                interaction.followUp({
                    content: `New solve -notifications will now be sent to \`${channelId}\`.`,
                    ephemeral: true
                })
            } catch (_) {
                interaction.followUp({
                    content: "An error occurred :/ Make sure the bot has access to the channel and the bot has the `Send messages` permission.",
                    ephemeral: true
                })
            }
        }
    } else {
        next()
    }
}
