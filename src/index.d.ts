declare global {
    var schemas: import("./configuration/schemas").Schemas;
    var databaseReady: boolean;
    var whitelistedHosts: string[];
    var whitelistedCTFdHosts: string[];
    var pollTimeCTFd: number;
    var discordPollUpdatedInterval: Number;
    var client: undefined | import("discord.js").Client;
    var messageLocationCache: Record<string, string>
}

export {}