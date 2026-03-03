const { Colors } = require('@jubbio/core');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    name: 'messageDelete',
    async execute(client, payload) {
        try {
            const guildId = payload?.guild_id || payload?.guildId;
            if (!guildId) return;

            const messageId = payload?.id || 'Bilinmiyor';
            const channelId = payload?.channel_id || payload?.channelId || '0';
            const userId = payload?.user_id || payload?.author?.id || 'Bilinmiyor';
            const content = payload?.content || 'Icerik bilgisi yok';

            await sendModLog(client, guildId, {
                color: Colors.DarkRed,
                title: 'Mesaj Silindi',
                description: `Bir mesaj silindi: ${messageId}`,
                fields: [
                    { name: 'Kanal', value: `<#${channelId}>`, inline: true },
                    { name: 'Yazar', value: `<@${userId}>`, inline: true },
                    { name: 'Icerik', value: content.slice(0, 1000), inline: false },
                ],
            });
        } catch (error) {
            console.error('[messageDelete] Event error:', error);
        }
    },
};
