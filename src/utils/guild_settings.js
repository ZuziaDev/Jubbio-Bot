const { db } = require('../config');

const DEFAULT_SETTINGS = {
    modlogChannelId: null,
    welcomeChannelId: null,
    leaveChannelId: null,
    welcomeMessage: 'Hos geldin {user}, {server} sunucusuna katildin!',
    leaveMessage: '{user} aramizdan ayrildi.',
    autoroleId: null,
};

function getSettingsPath(guildId) {
    return `guilds/${guildId}/bot_settings`;
}

function withDefaults(settings) {
    return {
        ...DEFAULT_SETTINGS,
        ...(settings || {}),
    };
}

async function getGuildSettings(guildId) {
    if (!guildId) return withDefaults(null);
    const data = await db.get(getSettingsPath(guildId));
    return withDefaults(data);
}

async function updateGuildSettings(guildId, partial) {
    if (!guildId) throw new Error('Guild ID is required');
    const current = await getGuildSettings(guildId);
    const next = {
        ...current,
        ...(partial || {}),
    };
    await db.set(getSettingsPath(guildId), next);
    return next;
}

function renderTemplate(template, context) {
    const safeTemplate = template || '';
    return safeTemplate
        .replace(/\{user\}/gi, context?.user || 'Bir uye')
        .replace(/\{server\}/gi, context?.server || 'Sunucu')
        .replace(/\{count\}/gi, String(context?.count || 0));
}

module.exports = {
    DEFAULT_SETTINGS,
    getGuildSettings,
    updateGuildSettings,
    renderTemplate,
};
