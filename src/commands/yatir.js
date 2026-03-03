const { SlashCommandBuilder, EmbedBuilder, Colors } = require('@jubbio/core');
const { formatMoney, parseAmountInput } = require('../utils/command_utils');
const { getAccount, getBankCapacity, saveAccount } = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yatir')
        .setDescription('Cuzdandaki parayi bankaya yatirirsin')
        .addStringOption((option) =>
            option
                .setName('miktar')
                .setDescription('Yatirilacak miktar (ornek: 1000 veya hepsi)')
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

        const amount = parseAmountInput(rawAmount, account.wallet);
        if (!amount || amount <= 0) {
            return interaction.reply({ content: 'Gecerli bir miktar girmelisin.', ephemeral: true });
        }

        const capacity = getBankCapacity(account);
        const available = Math.max(0, capacity - account.bank);
        if (available <= 0) {
            return interaction.reply({ content: 'Banka kasasi dolu. `vault_upgrade` alarak kapasiteyi arttirabilirsin.', ephemeral: true });
        }

        const finalAmount = Math.min(amount, account.wallet, available);
        if (finalAmount <= 0) {
            return interaction.reply({ content: 'Yatirabilecek bakiyen yok.', ephemeral: true });
        }

        account.wallet -= finalAmount;
        account.bank += finalAmount;
        await saveAccount(interaction.guildId, interaction.user.id, account);

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle('Banka Islem Basarili')
            .setDescription(`Bankaya **${formatMoney(finalAmount)}** yatirdin.`)
            .addFields(
                { name: 'Cuzdan', value: formatMoney(account.wallet), inline: true },
                { name: 'Banka', value: formatMoney(account.bank), inline: true },
                { name: 'Kapasite', value: `${formatMoney(account.bank)} / ${formatMoney(capacity)}`, inline: false }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
