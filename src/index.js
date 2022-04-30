require("dotenv").config()
const { Client, Intents } = require("discord.js")
const { connect } = require("mongoose")
const { readdirSync, statSync } = require("fs")

// Log project information
const { name, version } = require("../package.json")

console.log(`Package: ${name}@${version}`)
console.log(`Runtime: ${process.version}`)

// Internal dependencies & configs
require("./utils/console")
const slashCommands = require("./configuration/slash_commands")
global.schemas = require("./configuration/database_schemas")

// General globals
global.databaseReady = false
global.whitelistedHosts = ["cdn.discordapp.com", "cdn.discord.com", "media.discordapp.net"] // Hosts from which we can download thumbnails from
global.whitelistedCTFdHosts = ["challenge.fi"] // Hosts that can be used in the CTFd integration
global.pollTimeCTFd = 30000 // 30 seconds
global.discordPollUpdatedInterval = 5000 // 5 seconds

// Modules
const modules = {}
console.log("Running module discovery...")
// eslint-disable-next-line no-restricted-syntax
for (const file of readdirSync("./src/modules").filter((entry) => statSync(`./src/modules/${entry}`).isFile())) {
    try {
        const moduleName = file.replace(".js", "") // Note: Removes the first instance of .js
        // eslint-disable-next-line import/no-dynamic-require, global-require
        modules[moduleName] = require(`./modules/${file}`)
        console.log(`Imported "${file}" module.`)
    } catch (e) {
        console.error(`Failed to import module "${file}"`, e)
    }
}

console.log("Module discovery complete. Connecting to services...")

// Discord client configuration
const intents = new Intents()
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS)
const client = new Client({ intents })
global.client = client // Should not be needed...

// Establish database connection
if (process.env.DATABASE_URL === undefined) throw new Error("Missing DATABASE_URL from env")
connect(process.env.DATABASE_URL).then(() => {
    console.log("Connected to the database.")
    global.databaseReady = true
}).catch((e) => { throw e })

// Connect to Discord
client.on("ready", async () => {
    console.log(`Connected to Discord as ${client.user.username}#${client.user.discriminator} (${client.user.id}).`)
    client.user.setActivity("HedgeHax 😎 — /help", { type: "PLAYING" })

    // Register slash commands
    // NOTE: This feature has been removed by Discord (without notice...)
    /* const guildsWithDefaults = client.guilds.cache.map((guild) => guild.id)
    for await (const document of global.schemas.ServerAccessModel.find()) {
        console.debug(`Registering custom slash command configuration for ${document.id}...`)
        guildsWithDefaults.splice(guildsWithDefaults.indexOf(document.id), 1)
        const guild = await client.guilds.resolve(document.id)
        const newConfiguration = JSON.parse(JSON.stringify(slashCommands)).map((command) => { command.defaultPermission = false; return command })
        const commands = await guild.commands.fetch()
        await guild.commands.set(newConfiguration)
        const permissionUpdatesBulk = []
        // eslint-disable-next-line no-restricted-syntax
        for (const command of commands) {
            permissionUpdatesBulk.push({
                id: command[0],
                permissions: [
                    {
                        id: document.role,
                        type: "ROLE",
                        permission: true
                    },
                    // Server owner
                    {
                        id: guild.ownerId,
                        type: "USER",
                        permission: true
                    }
                ]
            })
        }
        await guild.commands.permissions.set({ fullPermissions: permissionUpdatesBulk })
        console.debug("Registered.")
    }
    // eslint-disable-next-line no-restricted-syntax
    for await (const guild of client.guilds.cache) {
        // eslint-disable-next-line no-continue
        if (!guildsWithDefaults.includes(guild[0])) continue
        console.warn(`Registering default slash command configuration for ${guild[0]}...`)
        await guild[1].commands.set(slashCommands)
        console.warn("Registered.")
    } */
    // Set all defaults
    console.warn("Registering slash commands...")
    // eslint-disable-next-line no-restricted-syntax
    for await (const guild of client.guilds.cache) {
        await guild[1].commands.set(slashCommands)
    }
    console.warn("Slash commands registered.")
})

// Listen for guild invites to register commands
client.on("guildCreate", async (guild) => {
    console.warn(`Invited! Registering default slash command configuration for ${guild[0]}...`)
    await guild.commands.set(slashCommands)
    console.warn("Registered.")
})

// Listen for deleted messages and automatically remove them from the location cache
global.messageLocationCache = {} // TODO: Global pollution is bad
client.on("messageDelete", (message) => {
    // TODO: Does this work for sure? Delete can sometimes be funky with global things...
    if (global.messageLocationCache[`${message.guild.id}-${message.id}`] !== undefined) delete global.messageLocationCache[`${message.guild.id}-${message.id}`]
})

// Listen for Discord interactions (ie. slash commands)
client.on("interactionCreate", async (interaction) => {
    if (interaction.user.bot) return
    // eslint-disable-next-line no-shadow, no-restricted-syntax
    for await (const name of Object.keys(modules)) {
        const module = modules[name]
        let breakOut = true
        const nextCall = () => { breakOut = false }
        await module(interaction, nextCall)
        if (interaction.replied) break // Interaction has been handled, we can safely assume nothing else wants to handle it
        if (breakOut) break
    }
})

// Establish Discord connection
client.login()
