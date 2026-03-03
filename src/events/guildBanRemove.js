const { Colors } = require('@jubbio/core');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    name: 'guildBanRemove',
    async execute(client, payload) {
        try {
            const guildId = payload?.guild_id || payload?.guildId;
            if (!guildId) return;

            const userId = payload?.user?.id || payload?.user_id || payload?.id || 'Bilinmiyor';

            await sendModLog(client, guildId, {
                color: Colors.Green,
                title: 'Ban Kaldirildi',
                description: `<@${userId}> kullanicisinin yasagi kaldirildi.`,
            });
        } catch (error) {
            console.error('[guildBanRemove] Event error:', error);
        }
    },
};
