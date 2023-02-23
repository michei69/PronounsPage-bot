import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from "discord.js"
import PronounsPageApi from "../api/PronounsPage"
import embedclr from "../utils/embedclr"
import getLanguage from "../utils/getLanguage"
import getUrl from "../utils/getUrl"

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

export default async (int: ButtonInteraction) => {
    // parse the custom id
    let splitted = int.customId.split("_")
    if (splitted.length < 3) return console.error(`[WORDS] Received ${splitted.length} arguments but needed 3`) 
    if (splitted[0] !== "W") return // not the correct function lol

    let ppuserId = splitted[1]
    let locale = splitted[2]
    
    var PPApi = new PronounsPageApi(locale)
    let ppuser = await PPApi.getUserById(ppuserId)

    if (!ppuser || !ppuser.id) return await int.reply({
        embeds: [
            new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Language might be in testing. Could not fetch details!")
            .setColor(embedclr)
            .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"], ephemeral: true
    })
    if (!(locale in ppuser.profiles)) return await int.reply({
        embeds: [
            new EmbedBuilder()
            .setTitle("Error")
            .setDescription("User does not have specified page.")
            .setColor(embedclr)
            .setThumbnail("attachment://cross.png")
        ], files: ["./static/cross.png"], ephemeral: true
    })

    let profile = ppuser.profiles[locale]
    let embed = new EmbedBuilder()
        .setAuthor({
            name: ppuser.username,
            iconURL: ppuser.avatarSource,
            url: `https://${getUrl(locale)}/@${ppuser.username}`
        }).setColor(embedclr)
        .setDescription(profile.description || "No description")
        .setFooter({
            text: "Account ID: %id%; Locale: %locale%".replace("%id%", ppuserId).replace("%locale%", locale)
        })
        .setThumbnail(ppuser.avatarSource)
    
    for (let column of profile.words){
        let prettifyColumn = ""
        for (let word of column.values){
            prettifyColumn += await getOpinion(word.opinion) + word.value + "\n"
        }
        if (!prettifyColumn) continue;
        embed.addFields({
            name: column.header || "\u200b", value: prettifyColumn, inline: true
        })
    }

    let actionRow = new ActionRowBuilder<ButtonBuilder>()
    let profileLocales = []
    for (let pf in ppuser.profiles) profileLocales.push(pf)
    let currentIndex = profileLocales.indexOf(locale)

    // PAINFUL IF-ELSE-IF
    // PLEASE REWRITE (or ill do it myself later if i dont forget)
    // this thing hurts my eyes for sure
    // atleast it does the job
    if (currentIndex - 1 < 0) {
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`P_${ppuserId}_${locale}`)
            .setLabel("Pronouns")
            .setStyle(ButtonStyle.Secondary)
        )
        if (profileLocales.length > 1){
            let length = profileLocales.length-currentIndex < 5 ? profileLocales.length-currentIndex : 4
            for (let i = 1; i<length + 1; i++) actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`W_${ppuserId}_${profileLocales[currentIndex+i]}`)
                .setLabel(await getLanguage(profileLocales[currentIndex + i], int.locale))
                .setStyle(ButtonStyle.Primary)
            )
        }
    } else if (currentIndex - 2 < 0) {
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`W_${ppuserId}_${profileLocales[currentIndex-1]}`)
            .setLabel(await getLanguage(profileLocales[currentIndex - 1], int.locale))
            .setStyle(ButtonStyle.Primary)
        )
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`P_${ppuserId}_${locale}`)
            .setLabel("Pronouns")
            .setStyle(ButtonStyle.Secondary)
        )
        if (profileLocales.length > 2){
            let length = profileLocales.length-currentIndex < 4 ? profileLocales.length-currentIndex : 3
            for (let i = 1; i<length+1; i++) actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`W_${ppuserId}_${profileLocales[currentIndex+i]}`)
                .setLabel(await getLanguage(profileLocales[currentIndex + i], int.locale))
                .setStyle(ButtonStyle.Primary)
            )
        }
    } else {
        // calculate how many buttons before
        let length = profileLocales.length-currentIndex-1 < 3 ? profileLocales.length-currentIndex-1 : 2
        length = Math.abs(2-length)
        for (let i = 2 + length; i>0; i--){
            actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`W_${ppuserId}_${profileLocales[currentIndex-i]}`)
                .setLabel(await getLanguage(profileLocales[currentIndex - i], int.locale))
                .setStyle(ButtonStyle.Primary)
            )
        }
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`P_${ppuserId}_${locale}`)
            .setLabel("Pronouns")
            .setStyle(ButtonStyle.Secondary)
        )
        // recalculate how many after
        length = Math.abs(2-length)
        if (length > 0){
            for (let i = 1; i<length + 1; i++) actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`W_${ppuserId}_${profileLocales[currentIndex+i]}`)
                .setLabel(await getLanguage(profileLocales[currentIndex + i], int.locale))
                .setStyle(ButtonStyle.Primary)
            )
        }
    }

    return await int.reply({
        embeds: [embed],
        ephemeral: true,
        components: [actionRow]
    })
}