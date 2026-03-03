const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { buyItem, getAccount, saveAccount } = require('../utils/economy');
const { formatMoney } = require('../utils/command_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('satinal')
        .setDescription('Marketten urun satin alirsin')
        .addStringOption((option) =>
            option
                .setName('urun')
                .setDescription('Satin alinacak urun ID')
                .setRequired(true)
                .addChoices(
                    { name: 'Lockpick', value: 'lockpick' },
                    { name: 'Shield', value: 'shield' },
                    { name: 'Lucky Charm', value: 'lucky_charm' },
                    { name: 'Vault Upgrade', value: 'vault_upgrade' }
                )
        )
        .addIntegerOption((option) =>
            option
                .setName('adet')
                .setDescription('Kac adet alinacak')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(50)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const itemId = interaction.options.getString('urun', true);
        const quantity = interaction.options.getInteger('adet', false) || 1;

        const account = await getAccount(interaction.guildId, interaction.user.id, {
            user: interaction.user,
        });

        const result = buyItem(account, itemId, quantity);
        if (!result.ok) {
            return interaction.reply({ content: result.reason, ephemeral: true });
        }

        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Satin Alma Basarili')
            .setDescription(`**${result.item.name}** urununden ${result.quantity} adet alindi.`)
            .addFields(
                { name: 'Toplam Tutar', value: formatMoney(result.totalCost), inline: true },
                { name: 'Kalan Cuzdan', value: formatMoney(account.wallet), inline: true },
                { name: 'XP', value: `+${result.xpInfo.xpGain}`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
