import { Model } from "mongoose"

type roleId = string
type messageId = string
type serverId = string
type URL = string
type challengeId = string
type channelId = string
type userId = string
type UnixTimestamp = string
type optionIdentifier = string

interface Embed {
    title: string,
    description: string,
    footer: string,
    image: string
}

interface RoleSelectionModel {
    id: serverId, // Server ID
    embed: Embed,
    message: messageId, // Message ID
    roles: Record<roleId, string>
}

interface CTFdIntegrationModel {
    id: serverId,
    apiToken: string,
    apiUrl: URL,
    cachedChallenges: challengeId[],
    /** @deprecated Never implemented */
    cachedLeaderboard: any,
    challengeNotifications: channelId,
    /** @deprecated Never implemented */
    leaderboardRoles: any,
    solveNotifications: channelId,
    cachedSolves: Record<challengeId, userId[]>
    /** @deprecated Never implemented */
    leaderboardSync: channelId
}

interface PollModel {
    id: serverId,
    embed: Embed,
    message: messageId,
    end: UnixTimestamp,
    options: Record<optionIdentifier, String>,
    votes: Record<optionIdentifier, userId[]>
}

interface ServerAccessModel {
    id: serverId,
    role: roleId
}

export interface Schemas {
    RoleSelectionModel: Model<RoleSelectionModel>,
    CTFdIntegrationModel: Model<CTFdIntegrationModel>
    PollModel: Model<PollModel>,
    ServerAccessModel: Model<ServerAccessModel>
}