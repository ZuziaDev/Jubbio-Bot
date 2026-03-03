const { EmbedBuilder, Colors } = require('@jubbio/core');

function formatMoney(amount) {
    return `${new Intl.NumberFormat('tr-TR').format(Math.floor(amount || 0))} JBC`;
}

function parseAmountInput(value, maxValue) {
    if (value === null || value === undefined) return null;

    const text = String(value).trim().toLowerCase();
    if (!text) return null;

    if (['all', 'hepsi', 'max', 'tum', 'tamami'].includes(text)) {
        return Math.max(0, Math.floor(maxValue || 0));
    }

    const numeric = Number(text.replace(/[, ]/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) return null;

    return Math.floor(numeric);
}

function formatDuration(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days) parts.push(`${days}g`);
    if (hours) parts.push(`${hours}s`);
    if (minutes) parts.push(`${minutes}d`);
    if (secs && parts.length === 0) parts.push(`${secs}sn`);

    return parts.join(' ') || '0sn';
}

function parseDurationToMs(input) {
    if (!input) return null;

    const text = String(input).trim().toLowerCase();
    const match = text.match(/^(\d+)(m|h|d|w)$/);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];

    if (amount <= 0) return null;

    const unitMap = {
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };

    return amount * unitMap[unit];
}

function hasPermission(interaction, permissionBit) {
    return Boolean(interaction.member?.permissions?.has?.(permissionBit));
}

async function replySafely(interaction, payload) {
    if (interaction.deferred || interaction.replied) {
        return interaction.editReply(payload);
    }
    return interaction.reply(payload);
}

function buildErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Hata')
        .setDescription(message || 'Bilinmeyen bir hata olustu.');
}

function buildSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle(title)
        .setDescription(description || 'Islem basarili.');
}

module.exports = {
    buildErrorEmbed,
    buildSuccessEmbed,
    formatDuration,
    formatMoney,
    hasPermission,
    parseAmountInput,
    parseDurationToMs,
    replySafely,
};
