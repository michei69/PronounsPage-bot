import PronounsPageApi from "./api/PronounsPage";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { LoadCommands, SlashCmd } from "./commands";
import LazyDatabase from "./database";
import localeHelper from "./localeHelper";
import dotenv from "dotenv"
dotenv.config({
    path: __dirname + "/../.env"
})
const { token, clientId, guildId } = process.env

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
})

const transHelper = new localeHelper()
const translations = transHelper.LoadAll()

// initialize database before everything else
const db = new LazyDatabase()
db.all(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    username TEXT
)`)
db.all(`CREATE TABLE IF NOT EXISTS bans (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    until INTEGER NOT NULL,
    guildId TEXT NOT NULL
)`)

// TODO
db.all(`CREATE TABLE IF NOT EXISTS mutes (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    until INTEGER NOT NULL,
    guildId TEXT NOT NULL
)`)

// TODO: fix
// setTimeout(async () => {
//     let bans = await db.get(`SELECT * FROM bans`)
//     let mutes = await db.get(`SELECT * FROM mutes`)
//     for (let ban of bans){
//         let until = parseInt(ban["until"])
//         let date = Math.floor(new Date().getTime()/1000) // unix
//         setTimeout(async () => {
//             let guild = await client.guilds.fetch(ban["guildId"])
//             if (!guild) {
//                 console.error("Could not find guild! Removing ban from db")
//                 await db.get(`DELETE FROM bans WHERE id="${ban["id"]}"`)
//             }
//             let user = await client.users.fetch(ban["id"])
//             if (!user) {
//                 console.error("Could not find user! Removing ban from db")
//                 await db.get(`DELETE FROM bans WHERE id="${ban["id"]}"`)
//             }
//             guild.members.unban(user, "Ban expired!")
//         }, date - until)
//     }
//     return;
//     for (let mute of mutes){
//         let until = parseInt(mute["until"])
//         let date = new Date().getTime() // unix
//         setTimeout(async () => {
//             let guild = await client.guilds.fetch(mute["guildId"])
//             if (!guild) {
//                 console.error("Could not find guild! Removing mute from db")
//                 await db.get(`DELETE FROM mutes WHERE id="${mute["id"]}"`)
//             }
//             let user = await guild.members.fetch(mute["id"])
//             if (!user) {
//                 console.error("Could not find user! Removing mute from db")
//                 await db.get(`DELETE FROM mutes WHERE id="${mute["id"]}"`)
//             }
//             user.roles.remove("") // TODO: add role
//         }, date - until)
//     }
// }, 1000 * 60) // check every min

// load when ready with async

var cmds: Collection<string, SlashCmd>;
client.on("ready", async ()=>{
    cmds = await LoadCommands(token, clientId, guildId)
    console.log(`Ready as ${client.user.tag}`)
})

client.on("interactionCreate", async int => {
    if (!int.isChatInputCommand()) return; // ignore button presses for this
    const cmd = cmds.get(int.commandName)
    if (!cmd) return console.error(`Command ${int.commandName} not found. Did all commands load successfully?`)
    let locale = translations[int.locale] || translations["en"]

    try{
        await cmd.execute(int)
    } catch (err) {
        console.error(err)
        try{
            await int.reply({
                content: locale["errorRunning"].replace("%commandname%", int.commandName),
                ephemeral: true
            })
        } catch (err) {
            await int.editReply({
                content: locale["errorRunning"].replace("%commandname%", int.commandName),
                embeds: [],
                files: []
            })
        }
    }
})

client.login(token)