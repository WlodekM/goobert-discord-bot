import {Client, IntentsBitField, REST, Routes, EmbedBuilder} from "discord.js"
import "dotenv/config"
import fs from "fs";

if (!fs.existsSync("db.json"))
    fs.writeFileSync("db.json", "{}");

const db = JSON.parse(fs.readFileSync("db.json").toString())

if (!fs.existsSync("shop.json"))
    fs.writeFileSync("shop.json", "{}");

const shop = JSON.parse(fs.readFileSync("shop.json").toString())

function syncDB() {
    fs.writeFileSync("db.json", JSON.stringify(db))
}

//NOTE - btw i could like put commands in their own files for organization

const commands = [
    {
        name: "goobert",
        description: "goobert"
    },
    {
        name: "miau",
        description: "watch the miau as it explodes"
    },
    {
        name: "grrr",
        description: "grrr"
    },
    {
        name: "dice",
        description: "roll los dice"
    },
    {
        name: "work",
        description: "get pancakes (cooldown of 5 minutes)"
    },
    {
        name: "bal",
        description: "see how many pancakes you have"
    },
    {
        name: "shop",
        description: "see what items you can buy with your pancakes"
    }
]

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log("we gonna slash command")
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {body: commands}
        )
        console.log("yippee slash commands real")
    } catch (error) {
        console.log("yikes")
        console.error(error)
    }
})();

const pancakeEmoji = "<:pancake:1333523925748945018>"

const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

bot.on("ready", (c) => {
    console.log(`${c.user.username} is here`);
})

bot.on("interactionCreate", (interaction) => {
    if (!interaction.isChatInputCommand()) {return};
    if (!db[interaction.user.id]) {
        db[interaction.user.id] = {
            balance: 0,
            cooldownUntil: 0,
            inventory: {}
        }
        syncDB();
    }
    const user = {
        id: interaction.user.id,
        get dbData() {
            return db[this.id]
        },
        set dbData(data) {
            db[this.id] = data;
            syncDB();
        },
        get balance() {
            return this.dbData.balance
        },
        set balance(newBalance) {
            this.dbData.balance = newBalance
        }
    }
    switch (interaction.commandName) {
        case "goobert":
            interaction.reply("goobert.");
            break;
        case "miau":
            interaction.reply("https://tenor.com/view/miau-hd-adobe-after-effects-glass-breaking-preset-gif-752576862881430143");
            break;
        case "grrr":
            const grr = [Math.random() > 0.5 ? "G" : "g", ...new Array(Math.floor(Math.random() * (28) + 3)).fill(0).map(_ => Math.random() > 0.5 ? "R" : "r")];
            interaction.reply(grr.join(""));
            break;
        case "dice":
            interaction.reply(`you rolled a ${Math.floor((Math.random() * 6) + 1)}`);
            break;
        case "work":
            if ((Date.now() / 1000) < db[interaction.user.id].cooldownUntil)
                return interaction.reply(`you cant work yet you dingus. try again <t:${Math.floor(db[interaction.user.id].cooldownUntil)}:R>`)
            const earned = Math.floor(Math.random() * 75) + 25;
            user.balance += earned
            interaction.reply(`you earned ${earned}${pancakeEmoji}. you now have ${user.balance}${pancakeEmoji}`);
            db[interaction.user.id].cooldownUntil = Number(new Date()) / 1000 + (60 * 5); // 5 mins
            syncDB()
            break;
        case "bal":
            interaction.reply(`you have ${db[interaction.user.id].balance}${pancakeEmoji}`);
            break;
        case "shop":
            console.log(shop)
            const shopembed = new EmbedBuilder({
                color: parseInt("ff00ff", 16),
                description: `the shop(tm), spend ur ${pancakeEmoji} here`,
                title: "the shop",
                fields: Object.entries(shop).map(([n, si]) => {
                    return {
                        name: `${si.displayName} (\`${n}\`)`,
                        value: `*"${si.description}"*\nPrice: **${si.price}${pancakeEmoji}**`
                    }
                })
            })
            interaction.reply({
                embeds: [shopembed]
            })
            break;
    }
})

bot.login(process.env.BOT_TOKEN)