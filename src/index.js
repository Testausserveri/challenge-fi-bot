// Dependencies
require("dotenv").config()
const { Client, Intents } = require("discord.js")
const { connect } = require("mongoose")
global.schemas = require("./schemas.js")

// Modules
const roleSelection = require("./modules/role_selection.js")
const access = require("./modules/access.js")
const purge = require("./modules/purge.js")
const polls = require("./modules/polls.js")
const slash_commands = require("./modules/slash_commands.js")

// Discord client configuration
const intents = new Intents()
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS)
const client = new Client({ intents })

// General globals
global.databaseReady = false
global.client = client // Should not be needed...
global.whitelistedHosts = ["cdn.discordapp.com", "cdn.discord.com", "media.discordapp.net"] // URLs from which we can download thumbnails from

// Establish database connection
if(process.env.DATABASE_URL === undefined) throw "Missing DATABASE_URL from env"
connect(process.env.DATABASE_URL).then(() => {
    console.log("Connected to the database.")
    global.databaseReady = true
}).catch(e => { throw e })

// Connect to Discord
client.on("ready", () => {
    console.log(`Connected to Discord as ${client.user.username}#${client.user.discriminator} (${client.user.id})`)
    // Register slash commands
    slash_commands(client)
})

// Listen for Discord interactions (ie. slash commands)
client.on("interactionCreate", interaction => {
    if(interaction.user.bot) return
    // Here we pass on the interaction event to modules
    // Role selection
    if(interaction.isButton()) roleSelection.clickButton(interaction)
    else roleSelection.interactionCreate(interaction)
    // Bot access
    access(interaction)
    // Purge
    purge(interaction)
    // Polls
    if(interaction.isButton()) polls.clickButton(interaction)
    else polls.interactionCreate(interaction)
})

// Establish Discord connection
client.login()