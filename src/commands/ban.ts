import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import LazyDatabase from "../database";
import localeHelper from "../localeHelper";
import embedclr from "../utils/embedclr";

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("ban")

const db = new LazyDatabase()

export default {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bans a user")
        .setDescriptionLocalizations(translations["description"])
        .addUserOption(user => user
            .setName("user")
            .setNameLocalizations(translations["userName"])
            .setDescription("The user to ban")
            .setDescriptionLocalizations(translations["userDesc"])
            .setRequired(true)    
        ).addStringOption(opt=>opt
            .setName("reason")
            .setNameLocalizations(translations["reasonName"])
            .setDescription("The reason for banning")    
            .setDescriptionLocalizations(translations["reasonDesc"])
        ).addStringOption(opt=>opt
            .setName("until")
            .setNameLocalizations(translations["untilName"])
            .setDescription("How much until unban")
            .setDescriptionLocalizations(translations["untilDesc"])    
        ).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(int: ChatInputCommandInteraction){
        if (!(int.member.permissions as PermissionsBitField).has(PermissionFlagsBits.BanMembers)) return await int.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["error"] || translations["generic"]["en-US"]["error"])
                .setDescription(translations["noPerms"][int.locale] || translations["noPerms"]["en-US"])
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
            ], files: ["./static/cross.png"], ephemeral: true
        })

        let user = int.options.getUser("user")
        let reason = int.options.getString("reason")
        let until = int.options.getString("until")
        let realuser = await int.guild.members.fetch(user)

        if (!realuser.bannable) return await int.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["error"] || translations["generic"]["en-US"]["error"])
                .setDescription(translations["noSelfPerms"][int.locale] || translations["noSelfPerms"]["en-US"])
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
            ], files: ["./static/cross.png"], ephemeral: true
        })
        try{
            if (reason) await (await realuser.createDM()).send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("You've been banned from the Pronouns.Page discord server")
                    .setDescription("Reason: " + reason)
                    .setColor(embedclr)
                    .setThumbnail("attachment://hammer.png")
                    .setAuthor({
                        name: "Banned by " + int.user.tag,
                        iconURL: int.user.avatarURL()
                    })
                ], files: ["./static/hammer.png"]
            })
        } catch (err) {} // still doesnt matter
        try{
            realuser.ban({
                reason: reason
            })
        } catch (err) {
            return await int.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(translations["generic"][int.locale]["error"] || translations["generic"]["en-US"]["error"])
                    .setDescription(translations["fakeUser"][int.locale] || translations["fakeUser"]["en-US"])
                    .setColor(embedclr)
                    .setThumbnail("attachment://cross.png")
                ], files: ["./static/cross.png"], ephemeral: true
            })
        }

        if (until){
            let time = until.split(" ")
            let months = 0
            let days = 0
            let hours = 0
            let minutes = 0
            let seconds = 0
            for (let t of time){
                let value = parseInt(t.substring(0, t.length-1)) || 0
                switch(t.substring(t.length-1)){
                    case "M": months = value; break;
                    case "d": days = value; break;
                    case "h": hours = value; break;
                    case "m": minutes = value; break;
                    case "s": seconds = value; break;
                }
            }
            let totalTime = seconds + minutes*60 + hours*60*60 + days*60*60*24 + months*60*60*24*30
            let totalUntil = Math.floor(new Date().getTime()/1000 + totalTime)
            await db.get(`INSERT OR REPLACE INTO bans VALUES ("${user.id}", ${totalUntil}, "${int.guildId}")`)
            setTimeout(async ()=>{
                int.guild.members.unban(user, "Ban expired!")
            }, totalTime)
        }

        return await int.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["success"] || translations["generic"]["en-US"]["success"])
                .setDescription((translations["banned"][int.locale] || translations["banned"]["en-US"]).replace("%tag%", user.tag).replace("%reason%", reason))
                .setColor(embedclr)
                .setThumbnail("attachment://check.png")
            ], files: ["./static/check.png"], ephemeral: true
        })
    }
}