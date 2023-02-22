import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import localeHelper from "../localeHelper";
import embedclr from "../utils/embedclr";

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("kick")

export default {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kicks a user")
        .setDescriptionLocalizations(translations["description"])
        .addUserOption(user => user
            .setName("user")
            .setNameLocalizations(translations["userName"])
            .setDescription("The user to kick")
            .setDescriptionLocalizations(translations["userDesc"])
            .setRequired(true)    
        ).addStringOption(opt=>opt
            .setName("reason")
            .setNameLocalizations(translations["reasonName"])
            .setDescription("The reason for kicking")    
            .setDescriptionLocalizations(translations["reasonDesc"])
        ).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers),
    async execute(int: ChatInputCommandInteraction){
        if (!(int.member.permissions as PermissionsBitField).has(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers)) return await int.reply({
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
        let realuser = await int.guild.members.fetch(user)

        if (!realuser.kickable) return await int.reply({
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
                    .setTitle("You've been kicked from the Pronouns.Page discord server")
                    .setDescription("Reason: " + reason)
                    .setColor(embedclr)
                    .setThumbnail("attachment://hammer.png")
                    .setAuthor({
                        name: "Kicked by " + int.user.tag, // could go without
                        iconURL: int.user.avatarURL()
                    })
                ], files: ["./static/hammer.png"]
            })
        } catch (err) {} // doesnt matter if we actually dm or not
        realuser.kick(reason)
        return await int.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["success"] || translations["generic"]["en-US"]["success"])
                .setDescription((translations["kicked"][int.locale] || translations["kicked"]["en-US"]).replace("%tag%", user.tag).replace("%reason%", reason))
                .setColor(embedclr)
                .setThumbnail("attachment://check.png")
            ], files: ["./static/check.png"], ephemeral: true
        })
    }
}