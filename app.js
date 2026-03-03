const path = require('path');
const { existsSync, readdirSync } = require('fs');
const { Client, GatewayIntentBits, PermissionFlagsBits, Collection } = require('@jubbio/core');

require('./src/config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
    ],
    permissions: [
        PermissionFlagsBits.CreateInstantInvite,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.ViewAuditLog,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.MentionEveryone,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.MoveMembers,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageEmojis,
        PermissionFlagsBits.ModerateMembers,
    ],
});
client.commands = new Collection();
client.commandPayloads = [];
client.pollStore = new Map();

const commandsPath = path.join(__dirname, 'src', 'commands');
if (existsSync(commandsPath)) {
    const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const command = require(`./src/commands/${file}`);
            if (!command?.data || typeof command.execute !== 'function') {
                console.warn(`[Command] Skipped invalid command file: ${file}`);
                continue;
            }
            client.commands.set(command.data.name, command);
            client.commandPayloads.push(command.data.toJSON());
        } catch (error) {
            console.error(`[Command] Failed to load ${file}:`, error);
        }
    }
}

const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('BOT_TOKEN environment variable is required.');
}

client.login(token).catch((error) => {
    console.error('[Client] Login failed:', error);
});
