const { Colors } = require('@jubbio/core');
const { sendModLog } = require('../utils/modlog');

module.exports = {
    name: 'guildBanAdd',
    async execute(client, payload) {
        try {
            const guildId = payload?.guild_id || payload?.guildId;
            if (!guildId) return;

            const userId = payload?.user?.id || payload?.user_id || payload?.id || 'Bilinmiyor';
            const reason = payload?.reason || 'Belirtilmedi';

            await sendModLog(client, guildId, {
                color: Colors.Red,
                title: 'Ban Eklendi',
                description: `<@${userId}> kullanicisi yasaklandi.`,
                fields: [{ name: 'Sebep', value: reason, inline: false }],
            });
        } catch (error) {
            console.error('[guildBanAdd] Event error:', error);
        }
    },
};
