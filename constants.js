export const COMMAND_NAMES = {
    REMINDAT: 'remindat',
    REMINDIN: 'remindin',
}

export const INTERACTION_TYPE = {
    PING: 1,
    APPLICATION_COMMAND: 2,
    MESSAGE_COMPONENT: 3,
    APPLICATION_COMMAND_AUTOCOMPLETE: 4,
    MODAL_SUBMIT: 5
}

export const INTERACTION_RESPONSE_TYPE = {
    PONG: 1,
    CHANNEL_MESSAGE_WITH_SOURCE: 4,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
    DEFERRED_UPDATE_MESSAGE: 6,
    UPDATE_MESSAGE: 7,
    APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
    MODAL: 9
}

// from: https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
export const APPLICATION_COMMAND_TYPE = {
    CHAT_INPUT: 1,
    USER: 2,
    MESSAGE: 3
}

// from: https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
export const APPLICATION_COMMAND_OPTION_TYPE = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11
}
