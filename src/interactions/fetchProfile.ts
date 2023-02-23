import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from "discord.js"
import PronounsPageApi from "../api/PronounsPage"
import localeHelper from "../localeHelper"
import embedclr from "../utils/embedclr"
import fetchPerson from "../utils/fetchPerson"
import getLanguage from "../utils/getLanguage"
import getUrl from "../utils/getUrl"
import LanguageUtil from "../utils/languageUtil"

const getOpinion = async (opinion: string, opinions?: object)=>{
    switch (opinion){
        case "yes": return "❤️"
        case "meh": return "👍"
        case "jokingly": return "😛"
        case "close": return "<:friends:1078248664818008075>"
        case "no": return "👎"
        default: return "❓" // for unknown tags
    }
}

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("fetch")
const langUtil = new LanguageUtil(translations)

export default async (int: ButtonInteraction) => {
    langUtil.update(int.locale)

    // parse the custom id
    let splitted = int.customId.split("_")
    if (splitted.length < 3) return console.error(`[PROFILE] Received ${splitted.length} arguments but needed 3`) 
    if (splitted[0] !== "P") return // not the correct function lol

    let ppuserId = splitted[1]
    let locale = splitted[2]
    
    // var PPApi = new PronounsPageApi(locale)
    // let ppuser = await PPApi.getUserById(ppuserId)
    await int.deferReply({
        ephemeral: true
    }) // defer to prevent timeout
    let user = await fetchPerson(ppuserId, locale, int.locale)

    if (!user) return await int.editReply({
        embeds: [
            new EmbedBuilder()
            .setTitle(langUtil.getGeneric("error"))
            .setDescription(langUtil.get("noUser").replace("\\n", "\n"))
            .setColor(embedclr)
            .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"]
    })
    // should never fire
    if (!user.profile) return await int.editReply({
        embeds: [
            new EmbedBuilder()
            .setTitle(langUtil.getGeneric("error"))
            .setDescription(langUtil.get("noPage"))
            .setColor(embedclr)
            .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"]
    })

    let embed = new EmbedBuilder()
        .setAuthor({
            name: user.user.username,
            iconURL: user.user.avatar,
            url: `https://${getUrl(locale)}/@${user.user.username}`
        }).setColor(embedclr)
        .setDescription(user.description || langUtil.get("noDesc"))
        .setFooter({
            text: langUtil.get("footer").replace("%id%", ppuserId).replace("%locale%", locale)
        })
        .setThumbnail(user.user.avatar)
    if (user.names){
        embed.addFields({
            name: langUtil.get("names"), value: user.names, inline: true
        })
    }
    if (user.pronouns){
        embed.addFields({
            name: langUtil.get("pronouns"), value: user.pronouns, inline: true
        })
    }
    if (user.flags){
        embed.addFields({
            name: langUtil.get("flags"), value: user.flags, inline: true
        })
    }
    if (user.timezone) {
        embed.addFields({
            name: langUtil.get("timezone"), value: user.timezone, inline: true
        })
    }
    if (user.circle) {
        embed.addFields({
            name: langUtil.get("circle"), value: user.circle, inline: true
        })
    }

    let actionRow = new ActionRowBuilder<ButtonBuilder>()
    let profileLocales = []
    for (let pf in user.user.profiles) profileLocales.push(pf)
    
    let currentIndex = profileLocales.indexOf(locale)
    let after = profileLocales.length - currentIndex - 1 // length is +1
    let before = profileLocales.length - after - 1 // - current
    if (before > 2 && after > 2) {
        // limit to only 2 before 2 after
        before = 2;
        after = 2;
    }
    if (before > 2 && after <= 2) before = 5 - after - 1 // number of btns - after - current button
    if (before <= 2 && after > 2) after = 5 - before - 1 // number of btns - before - current
    
    for (let i = before; i > 0; i--){
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`P_${user.user.id}_${profileLocales[currentIndex - i]}`)
            .setLabel(await getLanguage(profileLocales[currentIndex - i], int.locale))
            .setStyle(ButtonStyle.Primary)
        )
    }
    actionRow.addComponents(
        new ButtonBuilder()
        .setCustomId(`W_${user.user.id}_${profileLocales[currentIndex]}`)
        .setLabel(langUtil.get("words"))
        .setStyle(ButtonStyle.Secondary)
    )

    for (let i = 1; i < after + 1; i++){
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`P_${user.user.id}_${profileLocales[currentIndex + i]}`)
            .setLabel(await getLanguage(profileLocales[currentIndex + i], int.locale))
            .setStyle(ButtonStyle.Primary)
        )
    }

    return await int.editReply({
        embeds: [embed],
        components: [actionRow]
    })
}