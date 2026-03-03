const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatMoney, parseAmountInput } = require('../utils/command_utils');
const { getAccount, saveAccount } = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cek')
        .setDescription('Bankadaki parayi cuzdana cekersin')
        .addStringOption((option) =>
            option
                .setName('miktar')
                .setDescription('Cekilecek miktar (ornek: 1000 veya hepsi)')
                .setRequired(true)
        ),

    async execute(client, interaction) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda calisir.', ephemeral: true });
        }

        const rawAmount = interaction.options.getString('miktar', true);
        const account = await getAccount(interaction.guildId, interaction.user.id, {
            user: interaction.user,
        });

        const amount = parseAmountInput(rawAmount, account.bank);
        if (!amount || amount <= 0) {
            return interaction.reply({ content: 'Gecerli bir miktar girmelisin.', ephemeral: true });
        }

        const finalAmount = Math.min(amount, account.bank);
        if (finalAmount <= 0) {
            return interaction.reply({ content: 'Banka hesabinda yeterli para yok.', ephemeral: true });
        }

        account.bank -= finalAmount;
        account.wallet += finalAmount;

        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Para Cekildi')
            .setDescription(`Bankadan **${formatMoney(finalAmount)}** cektin.`)
            .addFields(
                { name: 'Cuzdan', value: formatMoney(account.wallet), inline: true },
                { name: 'Banka', value: formatMoney(account.bank), inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
