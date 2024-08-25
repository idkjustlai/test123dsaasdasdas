const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Client, Partials, EmbedBuilder, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { JWT } = require('google-auth-library');
const config = require('./config.json'); // Pastikan config.json ada dan berisi client_email dan private_key

const client = new Client({
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember
    ],
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(/ +/g);

    if (args[0] === '!ping') {
        const msg = await message.channel.send('Pinging...');
        msg.edit(`Pong! Latency is ${Math.floor(msg.createdTimestamp - message.createdTimestamp)}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    }

    if (args[0] === '!info') {
        const id = args[1];
        if (!id) return message.reply('Please provide an ID');

        try {
            const playerDetails = await getPlayerDetails(id);
            if (playerDetails) {
                const embed = new EmbedBuilder()
                    .setTitle('Player Details')
                    .setColor('Green')
                    .setDescription(playerDetails)
                    .setTimestamp();
                message.channel.send({ embeds: [embed] });
            } else {
                message.reply('ID not found');
            }
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while fetching player details.');
        }
    }

    if (args[0] === '!top') {
        let page = 0;
        try {
            const topPlayers = await getTopPlayers();
            const numPages = Math.ceil(topPlayers.length / 50);

            const embed = generateTopPlayersEmbed(topPlayers, page);
            const row = generatePaginationButtons(page, numPages);

            const topMessage = await message.channel.send({ embeds: [embed], components: [row] });

            const collector = topMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

            collector.on('collect', i => {
                if (i.customId === 'next') {
                    page++;
                } else if (i.customId === 'previous') {
                    page--;
                }

                const newEmbed = generateTopPlayersEmbed(topPlayers, page);
                const newRow = generatePaginationButtons(page, numPages);

                i.update({ embeds: [newEmbed], components: [newRow] });
            });

            collector.on('end', () => {
                topMessage.edit({ components: [] });
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while fetching top players.');
        }
    }
});

async function getPlayerDetails(id) {
    const serviceAccountAuth = new JWT({
        email: config.client_email,
        key: config.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const docId = "15QMUUHyjmKeLLb1I-fhgQGDt7TaXTBvUIxDdEYGwLhE";
    const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const numRows = rows.length + 1;
    await sheet.loadCells();

    for (let i = 2; i < numRows; i++) {
        const findID = sheet.getCellByA1(`A${i}`).value;
        if (findID == Number(id)) {
            return `**Player ID:** ${id}\n**Name:** ${sheet.getCellByA1(`B${i}`).value}\n**Power Before :** ${sheet.getCellByA1(`C${i}`).value}\n**Power Now:** ${sheet.getCellByA1(`D${i}`).value}\n**T4 before:** ${sheet.getCellByA1(`E${i}`).value}\n**T4 Now:** ${sheet.getCellByA1(`F${i}`).value}\n**point T4:** ${sheet.getCellByA1(`G${i}`).value}\n**T5 before:** ${sheet.getCellByA1(`H${i}`).value}\n**T5 Now:** ${sheet.getCellByA1(`I${i}`).value}\n**point T5:** ${sheet.getCellByA1(`J${i}`).value}\n**DEATHS before:** ${sheet.getCellByA1(`K${i}`).value}\n**Deaths Now:** ${sheet.getCellByA1(`L${i}`).value}\n**achivement death:** ${sheet.getCellByA1(`M${i}`).value}\n**target death:** ${sheet.getCellByA1(`N${i}`).value}\n**Achivement total point:** ${sheet.getCellByA1(`O${i}`).value}\n**Target Point kill:** ${sheet.getCellByA1(`P${i}`).value}\n**RANGKING:** ${sheet.getCellByA1(`Q${i}`).value}`;
        }
    }

    return null;
}

async function getTopPlayers() {
    const serviceAccountAuth = new JWT({
        email: config.client_email,
        key: config.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const docId = "15QMUUHyjmKeLLb1I-fhgQGDt7TaXTBvUIxDdEYGwLhE";
    const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const players = rows.map((row, index) => ({
        rank: index + 1,
        id: row._rawData[0],
        name: row._rawData[1],
        totalPoints: row._rawData[14], // Adjust the index according to your sheet
    }));

    players.sort((a, b) => b.totalPoints - a.totalPoints);

    return players;
}

function generateTopPlayersEmbed(players, page) {
    const start = page * 50;
    const end = start + 50;
    const topPlayers = players.slice(start, end).map(player => `**Rank ${player.rank}**\n**ID:** ${player.id}\n**Name:** ${player.name}\n**Total Points:** ${player.totalPoints}`).join('\n\n');

    return new EmbedBuilder()
        .setTitle('Top Players')
        .setColor('Green')
        .setDescription(topPlayers)
        .setTimestamp();
}

function generatePaginationButtons(page, numPages) {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle('SECONDARY')
                .setDisabled(page === 0),
            new MessageButton()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('SECONDARY')
                .setDisabled(page === numPages - 1),
        );
}

// Error Handling
client.on('warn', info => console.error(info));
client.on('error', error => console.error(error));
process.on('unhandledRejection', error => console.error(error));
process.on('uncaughtException', error => console.error(error));

// Rate Limit
client.rest.on('rateLimited', rateLimitInfo => console.log(rateLimitInfo));

// Replace 'YOUR_DISCORD_BOT_TOKEN' with your actual Discord bot token
const Token = "YOUR_DISCORD_BOT_TOKEN";
client.login(Token);
