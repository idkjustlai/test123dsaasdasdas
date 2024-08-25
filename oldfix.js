const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Client, Partials, EmbedBuilder } = require('discord.js');
const { JWT } = require('google-auth-library');
const config = require('./config.json');

const client = new Client({
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    partials: [Partials.User, Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember],
    intents: 131071
});


client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(/ +/g);

    console.log(args)

    if (args[0] === '!ping') {
        const msg = await message.channel.send('Pinging...');
        msg.edit(`Pong! Latency is ${Math.floor(msg.createdTimestamp - message.createdTimestamp)}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    }

    if (args[0] === '!info') {
        const id = args[1];
        if (!id) return message.reply('Please provide an ID');

        const serviceAccountAuth = new JWT({
            email: config.client_email,
            key: config.private_key,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });


        const docId = "15QMUUHyjmKeLLb1I-fhgQGDt7TaXTBvUIxDdEYGwLhE";

        const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        const rows = await sheet.getRows();
        const numRows = rows.length + 1

        await sheet.loadCells();

        const embed = new EmbedBuilder()
            .setTitle('Player Details')
            .setColor('Green')
            .setTimestamp()

        let idExists;

        for (let i = 2; i < numRows; i++) {
            const findID = sheet.getCellByA1(`A${i}`).value

            idExists = false

            if (findID == Number(id)) {
                embed.setDescription(`**Player ID:** ${id}\n**Name:** ${sheet.getCellByA1(`B${i}`).value}\n**Power Before :** ${sheet.getCellByA1(`C${i}`).value}\n**Power Now:** ${sheet.getCellByA1(`D${i}`).value}\n**T4 before:** ${sheet.getCellByA1(`E${i}`).value}\n**T4 Now:** ${sheet.getCellByA1(`F${i}`).value}\n**point T4:** ${sheet.getCellByA1(`G${i}`).value}\n**T5 before:** ${sheet.getCellByA1(`H${i}`).value}\n**T5 Now:** ${sheet.getCellByA1(`I${i}`).value}\n**point T5:** ${sheet.getCellByA1(`J${i}`).value}\n**DEATHS before:** ${sheet.getCellByA1(`K${i}`).value}\n**Deaths Now:** ${sheet.getCellByA1(`L${i}`).value}\n**achivement death:** ${sheet.getCellByA1(`M${i}`).value}\n**target death:** ${sheet.getCellByA1(`N${i}`).value}\n**Achivement total point:** ${sheet.getCellByA1(`O${i}`).value}\n**Target Point kill:** ${sheet.getCellByA1(`P${i}`).value}\n**RANGKING:** ${sheet.getCellByA1(`Q${i}`).value}`)
                idExists = true
                break;
            }

            idExists = false
        }
        
        if (!idExists) return message.reply('ID not found')
        
        message.channel.send({ embeds: [embed] });

    }

})

// Error Handling
client.on('warn', info => console.error(info));
client.on('error', error => console.error(error));
process.on('unhandledRejection', error => console.error(error));
process.on('uncaughtException', error => console.error(error));

// Rate Limit
client.rest.on('rateLimited', (rateLimitInfo) => console.log(rateLimitInfo));

const Token = ""
client.login(Token);
