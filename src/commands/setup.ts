import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import PronounsPageApi from "../api/PronounsPage";
import LazyDatabase from "../database";
import embedclr from "../utils/embedclr";
import localeHelper from "../localeHelper"
import LanguageUtil from "../utils/languageUtil";

const PPApi = new PronounsPageApi()
const db = new LazyDatabase()
const sanitizeRegex = /[^1-9, a-z, A-Z, _, \w, .]/gm
const validRegex = /^[\p{L}\p{N}._-]+$/gu // pronouns.page - ./src/username.js

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("setup")
const langUtil = new LanguageUtil(translations)

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
        langUtil.update(int.locale)

        var username: string = int.options.getString("username")
        if (!username.match(validRegex)) return await int.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(langUtil.getGeneric("error"))
                .setDescription(langUtil.get("invalidUser"))
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
            ], files: ["./static/cross.png"], ephemeral: true
        })
        await int.reply({
            content: (langUtil.get("looking")).replace("%username%", username),
            ephemeral: true
        })
        let user = await PPApi.getUser(username)
        if (!user) return await int.editReply({embeds: [
            new EmbedBuilder()
                .setTitle(langUtil.getGeneric("error"))
                .setDescription(langUtil.get("noUser"))
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"], content:""})
        if (!user.id) return await int.editReply({embeds: [
            new EmbedBuilder()
                .setTitle(langUtil.getGeneric("error"))
                .setDescription(langUtil.get("noUser"))
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"], content:""})
        
        db.get(`INSERT OR REPLACE INTO users
                VALUES ("${int.user.id}", ${JSON.stringify(username)})`)
        await int.editReply({embeds: [
            new EmbedBuilder()
                .setTitle(langUtil.getGeneric("success"))
                .setDescription(langUtil.get("setAcc").replace("%username%",username))
                .setColor(embedclr)
                .setThumbnail("attachment://check.png")
        ], files: ["./static/check.png"], content:""})
    }
}