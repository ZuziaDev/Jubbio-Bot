const { EmbedBuilder, Colors } = require('@jubbio/core');
const { getGuildSettings } = require('./guild_settings');

async function sendModLog(client, guildId, payload) {
    if (!guildId) return false;

    const settings = await getGuildSettings(guildId);
    if (!settings.modlogChannelId) return false;

    const embed = new EmbedBuilder()
        .setColor(payload.color || Colors.DarkBlue)
        .setTitle(payload.title || 'Mod Log')
        .setDescription(payload.description || 'Bir olay kaydi olustu.')
        .setTimestamp();

    if (Array.isArray(payload.fields) && payload.fields.length > 0) {
        embed.addFields(...payload.fields);
    }

    if (payload.footer) {
        embed.setFooter({ text: payload.footer });
    }

    try {
        await client.rest.createMessage(guildId, settings.modlogChannelId, {
            embeds: [embed.toJSON()],
        });
        return true;
    } catch (error) {
        console.error('[ModLog] Failed to send log:', error.message);
        return false;
    }
}

module.exports = {
    sendModLog,
};
