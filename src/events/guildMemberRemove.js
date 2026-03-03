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
    name: 'guildMemberRemove',
    async execute(client, payload) {
        try {
            const guildId = payload?.guild_id || payload?.guildId;
            if (!guildId) return;

            const user = getUserFromPayload(payload);
            const userId = String(user.id);
            const username = user.username || 'Bilinmiyor';

            const settings = await getGuildSettings(guildId);

            if (settings.leaveChannelId) {
                const guild = client.guilds.get(guildId);
                const count = guild?.members?.size || 0;
                const serverName = guild?.name || 'Sunucu';

                const messageText = renderTemplate(settings.leaveMessage, {
                    user: `<@${userId}>`,
                    server: serverName,
                    count,
                });

                await client.rest.createMessage(guildId, settings.leaveChannelId, {
                    content: messageText,
                }).catch((error) => {
                    console.error('[Leave] Message send failed:', error.message);
                });
            }

            await sendModLog(client, guildId, {
                color: Colors.Orange,
                title: 'Uye Ayrildi',
                description: `<@${userId}> sunucudan ayrildi.`,
                fields: [
                    { name: 'Kullanici', value: `${username} (${userId})`, inline: false },
                ],
            });
        } catch (error) {
            console.error('[guildMemberRemove] Event error:', error);
        }
    },
};
