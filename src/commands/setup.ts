import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import PronounsPageApi from "../api/PronounsPage";
import LazyDatabase from "../database";
import embedclr from "../utils/embedclr";
import localeHelper from "../localeHelper"

const PPApi = new PronounsPageApi()
const db = new LazyDatabase()
const sanitizeRegex = /[^1-9, a-z, A-Z, _, \w, .]/gm

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("setup")

export default {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Connect your Pronouns.Page account")
        .setDescriptionLocalizations(translations["description"])
        .addStringOption(inp=>inp
            .setName("username")
            .setNameLocalizations(translations["usernameName"])
            .setDescription("Your Pronouns.Page username")
            .setDescriptionLocalizations(translations["usernameDesc"])
            .setRequired(true)),
    async execute(int: ChatInputCommandInteraction) {
        var username: string = int.options.getString("username")
        username = username.replace(sanitizeRegex, "")
        await int.reply({
            content: (translations["looking"][int.locale] || translations["looking"]["en-US"]).replace("%username%", username),
            ephemeral: true
        })
        let user = await PPApi.getUser(username)
        if (!user) return await int.editReply({embeds: [
            new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["error"] || translations["generic"]["en-US"]["error"])
                .setDescription(translations["noUser"][int.locale] || translations["noUser"]["en-US"])
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"], content:""})
        if (!user.id) return await int.editReply({embeds: [
            new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["error"] || translations["generic"]["en-US"]["error"])
                .setDescription(translations["noUser"][int.locale] || translations["noUser"]["en-US"])
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"], content:""})
        
        db.get(`INSERT OR REPLACE INTO users
                VALUES ("${int.user.id}", "${username}")`)
        await int.editReply({embeds: [
            new EmbedBuilder()
                .setTitle(translations["generic"][int.locale]["success"] || translations["generic"]["en-US"]["success"])
                .setDescription((translations["setAcc"][int.locale] || translations["noUser"]["en-US"]).replace("%username%",username))
                .setColor(embedclr)
                .setThumbnail("attachment://check.png")
        ], files: ["./static/check.png"], content:""})
    }
}