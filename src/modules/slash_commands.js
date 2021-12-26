const { Client } = require("discord.js")
/**
 * Register slash commands
 * @param {Client} client 
 */
module.exports = client => {
    for(const guild of client.guilds.cache){
        guild[1].commands.set([
            // Role selection
            {
                name: "role-selection",
                description: "Manage role selections.",
                options: [
                    {
                        name: "create",
                        description: "Create a new role selection message.",
                        type: 1,
                        options: [
                            {
                                name: "title",
                                description: "Embed title",
                                required: true,
                                type: 3
                            },
                            {
                                name: "description",
                                description: "Embed description",
                                required: true,
                                type: 3
                            },
                            {
                                name: "footer",
                                description: "Embed footers",
                                required: false,
                                type: 3
                            },
                            {
                                name: "thumbnail_url",
                                description: "Embed thumbnail",
                                required: false,
                                type: 3
                            },
                            {
                                name: "color",
                                description: "Embed color",
                                required: false,
                                type: 3
                            }
                        ]
                    },
                    {
                        name: "add-option",
                        description: "Add a role selection option to a role selection message.",
                        type: 1,
                        options: [
                            {
                                name: "message_id",
                                description: "The message id",
                                required: true,
                                type: 3
                            },
                            {
                                name: "button_text",
                                description: "The button text",
                                required: true,
                                type: 3
                            },
                            {
                                name: "role_id",
                                description: "The role id",
                                required: true,
                                type: 3
                            }
                        ]
                    },
                    {
                        name: "remove-option",
                        description: "Remove a role selection option from a role selection message.",
                        type: 1,
                        options: [
                            {
                                name: "message_id",
                                description: "The message id",
                                required: true,
                                type: 3
                            },
                            {
                                name: "role_id",
                                description: "The role id",
                                required: true,
                                type: 3
                            }
                        ]
                    },
                    {
                        name: "remove",
                        description: "Remove a role selection.",
                        type: 1,
                        options: [
                            {
                                name: "message_id",
                                description: "The message id",
                                required: true,
                                type: 3
                            }
                        ]
                    }
                ]
            },
            // Configure accesses
            {
                name: "configure-access",
                description: "Set bot access role.",
                type: 1,
                options: [{
                    name: "role_id",
                    description: "The role id",
                    required: true,
                    type: 3
                }]
            },
            // Purge
            {
                name: "purge",
                description: "Purge messages from a channel.",
                type: 1,
                options: [
                    {
                        name: "count",
                        description: "How many messages to remove.",
                        required: true,
                        type: 3
                    },
                    {
                        name: "user-id",
                        description: "Only remove messages sent by this user.",
                        required: false,
                        type: 3
                    }
                ]
            },
            // Polls
            {
                name: "poll",
                description: "Manage polls",
                type: 1,
                options: [
                    {
                        name: "create",
                        type: 1,
                        description: "Create a new poll.",
                        options: [
                            {
                                name: "title",
                                description: "Embed title",
                                required: true,
                                type: 3
                            },
                            {
                                name: "description",
                                description: "Embed description",
                                required: true,
                                type: 3
                            },
                            {
                                name: "options",
                                description: "A semicolon separated list of poll options",
                                required: true,
                                type: 3
                            },
                            {
                                name: "thumbnail_url",
                                description: "Embed thumbnail",
                                required: false,
                                type: 3
                            },
                            {
                                name: "color",
                                description: "Embed color",
                                required: false,
                                type: 3
                            },
                            {
                                name: "duration",
                                description: "How long should the poll should last? (<number> day(s)/hour(s)/minute(s)/second(s))",
                                type: 3,
                                required: false
                            }
                        ]
                    },
                    {
                        name: "end",
                        description: "End a poll.",
                        type: 1,
                        options: [
                            {
                                name: "message_id",
                                description: "The message id",
                                required: true,
                                type: 3
                            }
                        ]
                    }
                ]
            }
        ])
    }
}