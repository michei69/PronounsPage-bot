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
    if (splitted.length < 3) return console.error(`[WORDS] Received ${splitted.length} arguments but needed 3`) 
    if (splitted[0] !== "W") return // not the correct function lol

    let ppuserId = splitted[1]
    let locale = splitted[2]
    
    await int.deferReply({
        ephemeral: true
    }) // defer to prevent timeout
    
    let user = await fetchPerson(ppuserId, locale)

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

    for (let column of user.profile.words){
        let prettifyColumn = ""
        let count = 0
        for (let word of column.values){
            count++;
            if (count > 25) {
                prettifyColumn += langUtil.getGeneric("andMore").replace("%count%", column.values.slice(count).length.toString())
                break;
            }
            prettifyColumn += await getOpinion(word.opinion) + word.value + "\n"
        }
        if (!prettifyColumn) continue;
        embed.addFields({
            name: column.header || "\u200b", value: prettifyColumn, inline: true
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
            .setCustomId(`W_${user.user.id}_${profileLocales[currentIndex - i]}`)
            .setLabel(await getLanguage(profileLocales[currentIndex - i], int.locale))
            .setStyle(ButtonStyle.Primary)
        )
    }
    actionRow.addComponents(
        new ButtonBuilder()
        .setCustomId(`P_${user.user.id}_${profileLocales[currentIndex]}`)
        .setLabel(langUtil.get("pronouns"))
        .setStyle(ButtonStyle.Secondary)
    )

    for (let i = 1; i < after + 1; i++){
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`W_${user.user.id}_${profileLocales[currentIndex + i]}`)
            .setLabel(await getLanguage(profileLocales[currentIndex + i], int.locale))
            .setStyle(ButtonStyle.Primary)
        )
    }

    return await int.editReply({
        embeds: [embed],
        components: [actionRow]
    })
}