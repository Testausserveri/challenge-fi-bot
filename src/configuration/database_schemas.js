/* eslint-disable new-cap, function-paren-newline */
const { model, Schema } = require("mongoose")

const RoleSelectionModel = model(
    "RoleSelectionModel",
    Schema({
        id: String, // Server ID,
        embed: {
            title: String,
            description: String,
            footer: String,
            image: String // Base64 image
        },
        message: String, // Embed ID
        roles: Object // Object with keys as roleIDs and value as button text
    })
)

const CTFdIntegrationModel = model(
    "CTFdIntegrationModel",
    Schema({
        id: String, // Server ID
        apiToken: String, // CTFd API token
        apiUrl: String, // CTFd API URL
        cachedChallenges: Array, // List of cached challenges ids'
        cachedLeaderboard: Array, // Leaderboard in a simplified format
        challengeNotifications: String, // New challenge notification channel ID
        leaderboardRoles: Array, // List of roles to give for specific leaderboard positions
        solveNotifications: String, // Solve notifications
        cachedSolves: Object, // Users who solved a specific challenge
        leaderboardSync: String // The message ID of the leaderboard to sync
    })
)

const PollModel = model(
    "PollModel",
    Schema({
        id: String, // Server ID
        embed: {
            title: String,
            description: String,
            image: String // Base64 image
        },
        message: String, // Embed id
        end: String, // Unix time to end the poll at
        options: Object, // Object with keys as emoji IDs and values as option definitions
        votes: Object // Object with the same keys as above and values as user id's of people voted
    })
)

const ServerAccessModel = model(
    "ServerAccessModel",
    Schema({
        id: String, // Server ID
        role: String // Role ID
    })
)

module.exports = {
    RoleSelectionModel,
    CTFdIntegrationModel,
    PollModel,
    ServerAccessModel
}
