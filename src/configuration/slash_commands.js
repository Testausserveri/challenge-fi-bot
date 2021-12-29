/**
 * Default slash commands configuration
 */
module.exports = [
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
                description:
                    "Add a role selection option to a role selection message.",
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
                description:
                    "Remove a role selection option from a role selection message.",
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
        description:
            "Set bot access role and restrict slash command visibility.",
        type: 1,
        options: [
            {
                name: "role_id",
                description: "The role id",
                required: true,
                type: 3
            }
        ]
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
                        description:
                            "A semicolon separated list of poll options",
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
                        description:
                            "How long should the poll should last? (<number> day(s)/hour(s)/minute(s)/second(s))",
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
    },
    // CTFd integration
    {
        name: "ctfd",
        description: "Manage the CTFd integration",
        type: 1,
        options: [
            {
                name: "configure-api",
                description:
                    "Configure the CTFd integration. This resets all features (such as leaderboard sync & roles).",
                type: 1,
                options: [
                    {
                        name: "api-host",
                        description: "The CTFd API host",
                        type: 3,
                        required: true
                    },
                    {
                        name: "api-token",
                        description: "The CTFd API Token",
                        type: 3
                    }
                ]
            },
            {
                name: "configure-leaderboard-roles",
                description:
                    "Set which roles are given to various leaderboard positions. Leave empty to disable this feature.",
                type: 1,
                options: [
                    {
                        name: "1st-position-role-id",
                        description: "The role given to the user on 1st place",
                        type: 3,
                        required: false
                    },
                    {
                        name: "2nd-position-role-id",
                        description: "The role given to the user on 1st place",
                        type: 3,
                        required: false
                    },
                    {
                        name: "3rd-position-role-id",
                        description: "The role given to the user on 1st place",
                        type: 3,
                        required: false
                    }
                ]
            },
            {
                name: "configure-chall-notifications",
                description:
                    "Configure new challenge -notifications. Leave empty to disable.",
                type: 1,
                options: [
                    {
                        name: "channel-id",
                        type: 3,
                        description:
                            "The id of the channel to send notifications to."
                    }
                ]
            },
            {
                name: "configure-solve-notifications",
                description:
                    "Configure new solve -notifications. Leave empty to disable.",
                type: 1,
                options: [
                    {
                        name: "channel-id",
                        type: 3,
                        description:
                            "The id of the channel to send notifications to."
                    }
                ]
            },
            {
                name: "create-leaderboard-clone",
                description: "Create an updating leaderboard embed.",
                type: 3
            }
        ]
    }
]
