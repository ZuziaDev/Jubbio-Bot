const { Colors } = require('@jubbio/core');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    name: 'messageUpdate',
    async execute(client, payload) {
        try {
            const guildId = payload?.guild_id || payload?.guildId;
            if (!guildId) return;

            const channelId = payload?.channel_id || payload?.channelId || '0';
            const userId = payload?.user_id || payload?.author?.id || 'Bilinmiyor';
            const content = payload?.content || 'Icerik bilgisi yok';

            await sendModLog(client, guildId, {
                color: Colors.DarkBlue,
                title: 'Mesaj Duzenlendi',
                description: `Bir mesaj duzenlendi: ${payload?.id || 'Bilinmiyor'}`,
                fields: [
                    { name: 'Kanal', value: `<#${channelId}>`, inline: true },
                    { name: 'Yazar', value: `<@${userId}>`, inline: true },
                    { name: 'Yeni Icerik', value: content.slice(0, 1000), inline: false },
                ],
            });
        } catch (error) {
            console.error('[messageUpdate] Event error:', error);
        }
    },
};
