async function syncGuildCommands(client, guildId, desiredCommands) {
    const existing = await client.rest.listGuildCommands(guildId);
    const byName = new Map(existing.map((command) => [command.name, command]));

    let created = 0;
    let updated = 0;
    const removed = 0;

    for (const command of desiredCommands) {
        const current = byName.get(command.name);
        if (!current) {
            await client.rest.registerGuildCommands(guildId, [command]);
            created += 1;
            continue;
        }

        const commandId = current.id || current.command_id;
        if (commandId) {
            await client.rest.updateGuildCommand(guildId, commandId, command);
            updated += 1;
        }
        byName.delete(command.name);
    }

    return { created, updated, removed };
}

async function syncGlobalCommands(client, desiredCommands) {
    const existing = await client.rest.listGlobalCommands();
    const byName = new Map(existing.map((command) => [command.name, command]));

    let created = 0;
    let updated = 0;
    const removed = 0;

    for (const command of desiredCommands) {
        const current = byName.get(command.name);
        if (!current) {
            await client.rest.registerGlobalCommands([command]);
            created += 1;
            continue;
        }

        const commandId = current.id || current.command_id;
        if (commandId) {
            await client.rest.updateGlobalCommand(commandId, command);
            updated += 1;
        }
        byName.delete(command.name);
    }

    return { created, updated, removed };
}

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`[Ready] Logged in as ${client.user?.username || 'Unknown'} (${client.user?.id || 'N/A'})`);

        const commands = client.commandPayloads || [];
        if (commands.length === 0) {
            console.warn('[Ready] No slash command payloads found. Skipping registration.');
            return;
        }

        const targetGuildId = process.env.DEV_GUILD_ID || process.env.GUILD_ID || process.env.COMMAND_GUILD_ID;

        try {
            if (targetGuildId) {
                const result = await syncGuildCommands(client, targetGuildId, commands);
                console.log(
                    `[Ready] Guild command sync (${targetGuildId}) => created:${result.created} updated:${result.updated} removed:${result.removed}`
                );
            } else {
                const result = await syncGlobalCommands(client, commands);
                console.log(
                    `[Ready] Global command sync => created:${result.created} updated:${result.updated} removed:${result.removed}`
                );
            }
        } catch (error) {
            console.error('[Ready] Command sync failed:', error);
        }
    },
};
