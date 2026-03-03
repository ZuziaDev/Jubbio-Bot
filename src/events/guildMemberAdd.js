const { Colors } = require('@jubbio/core');
const { getGuildSettings, renderTemplate } = require('../utils/guild_settings');
const { sendModLog } = require('../utils/modlog');

function getUserFromPayload(payload) {
    if (payload?.user) return payload.user;
    if (payload?.member?.user) return payload.member.user;
    return {
        id: payload?.user_id ? String(payload.user_id) : '0',
        username: 'Bilinmiyor',
    };
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(client, payload) {
        try {
            const guildId = payload?.guild_id || payload?.guildId;
            if (!guildId) return;

            const user = getUserFromPayload(payload);
            const userId = String(user.id);
            const username = user.username || 'Bilinmiyor';

            const settings = await getGuildSettings(guildId);

            if (settings.autoroleId) {
                await client.rest.addMemberRole(guildId, userId, settings.autoroleId).catch((error) => {
                    console.error('[Autorole] Role assign failed:', error.message);
                });
            }

            if (settings.welcomeChannelId) {
                const guild = client.guilds.get(guildId);
                const count = guild?.members?.size || 0;
                const serverName = guild?.name || 'Sunucu';

                const messageText = renderTemplate(settings.welcomeMessage, {
                    user: `<@${userId}>`,
                    server: serverName,
                    count,
                });

                await client.rest.createMessage(guildId, settings.welcomeChannelId, {
                    content: messageText,
                }).catch((error) => {
                    console.error('[Welcome] Message send failed:', error.message);
                });
            }

            await sendModLog(client, guildId, {
                color: Colors.Green,
                title: 'Uye Katildi',
                description: `<@${userId}> sunucuya katildi.`,
                fields: [
                    { name: 'Kullanici', value: `${username} (${userId})`, inline: false },
                    { name: 'Otorol', value: settings.autoroleId ? `<@&${settings.autoroleId}>` : 'Kapali', inline: true },
                ],
            });
        } catch (error) {
            console.error('[guildMemberAdd] Event error:', error);
        }
    },
};
