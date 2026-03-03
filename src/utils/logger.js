const axios = require('axios');

const WEBHOOK_URL = "https://discord.com/api/webhooks/1447312042590605384/C0h7CTMkG9oI-KIP1u0p5ua_5142yQZSkaeJvXniOgC0FZTDIee43GgInSfg_eFtQXEY";

/**
 * Logs an update to the Discord Webhook
 * @param {string} title - Title of the update
 * @param {string} description - Details of the changes
 * @param {'feature'|'bugfix'|'refactor'|'other'} type - Type of update
 */
async function logUpdate(title, description, type = 'feature') {
    let color = 0xc170af; // Default Neuroa Pink
    let emoji = "✨";

    if (type === 'bugfix') {
        color = 0xff4444; // Red
        emoji = "🐛";
    } else if (type === 'feature') {
        color = 0x00ff00; // Green
        emoji = "🚀";
    } else if (type === 'refactor') {
        color = 0xffaa00; // Orange
        emoji = "🔧";
    }

    const embed = {
        title: `${emoji} ${title}`,
        description: description,
        color: color,
        footer: {
            text: "Neuroa Dev Logger",
        },
        timestamp: new Date().toISOString()
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        console.log("✅ Update logged to webhook successfully.");
    } catch (error) {
        console.error("❌ Failed to log update:", error.message);
    }
}

module.exports = { logUpdate };
