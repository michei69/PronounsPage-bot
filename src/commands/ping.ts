import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import localeHelper from "../localeHelper";
import embedclr from "../utils/embedclr";
import LanguageUtil from "../utils/languageUtil";

const connIcons = {
    low: "./static/empty.png",
    near_low: "./static/near-empty.png",
    medium: "./static/half.png",
    near_high: "./static/near-full.png",
    high: "./static/full.png",
}
const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("ping")
const langUtil = new LanguageUtil(translations)

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Shows the bot's response time")
        .setDescriptionLocalizations(translations["description"]),
    async execute(int: ChatInputCommandInteraction) {
        langUtil.update(int.locale)

        let ping = int.client.ws.ping
        let icon = connIcons.high
        if (ping > 250) icon = connIcons.near_high
        if (ping > 450) icon = connIcons.medium
        if (ping > 700) icon = connIcons.near_low
        if (ping > 1000) icon = connIcons.low
        // couldve wrote this 50 different ways
        let iconUrl = `attachment://${icon.split("/")[icon.split("/").length - 1]}`
        await int.reply({embeds: [
            new EmbedBuilder()
                .setTitle(langUtil.get("responseTitle"))
                .setDescription(langUtil.get("latency").replace("%latency%", int.client.ws.ping.toString()).replace("\\n", "\n"))
                .setColor(embedclr)
                .setThumbnail(iconUrl)
        ], files: [icon]})
    }
}