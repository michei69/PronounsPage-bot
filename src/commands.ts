import { Routes, REST, Collection, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "node:fs"

const DEV = true;

// interface for cmd for autocomplete
export interface SlashCmd{
    data: SlashCommandBuilder,
    execute(int: ChatInputCommandInteraction)
}

const cmds = []
const actualCmds = new Collection<string, SlashCmd>()

for (let file of fs.readdirSync(`${__dirname}/commands`)){
    let cmd: SlashCmd = require(`${__dirname}/commands/${file}`).default
    // console.log(cmd)
    cmds.push(cmd.data.toJSON())

    if ("data" in cmd && "execute" in cmd){
        actualCmds.set(cmd.data.name, cmd)
    } else {
        console.log(`[!!!] Command "${file}" has no data or execute property!`)
    }
}

// deploy the commands
export const LoadCommands = async (token, clientId, guildId)=>{
    const rest = new REST({
        version: "10"
    }).setToken(token);
    try{
        console.log(`Deploying ${cmds.length} commands${DEV ? " for development server" : ""}...`)
        var data;
        if (DEV) {
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: cmds }
            )
        } else {
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: cmds }
            )
        }
        console.log(`Reloaded ${data.length} commands!`)
    } catch (err) {
        console.log(`[!!!] Could not deploy commands successfully. Continuing with what's already synced... (NOT SAFE)`)
        console.error(err)
    }
    return actualCmds
}