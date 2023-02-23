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
    if (splitted.length < 3) return console.error(`[PROFILE] Received ${splitted.length} arguments but needed 3`) 
    if (splitted[0] !== "P") return // not the correct function lol

    let ppuserId = splitted[1]
    let locale = splitted[2]
    
    var PPApi = new PronounsPageApi(locale)
    let ppuser = await PPApi.getUserById(ppuserId)

    if (!ppuser || !ppuser.id) return await int.reply("Language might be in testing. Could not fetch details!")
    if (!(locale in ppuser.profiles)) return await int.reply("User does not have specified page")

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
    if (profile.names){
        let prettifyNames = ""
        for (let name of profile.names){
            prettifyNames += await getOpinion(name.opinion) + " " + name.value + "\n"
        }
        embed.addFields({
            name: "Names", value: prettifyNames, inline: true
        })
    }
    if (profile.pronouns){
        let prettifyPronouns = ""
        for (let pronoun of profile.pronouns){
            let infoPronoun = await PPApi.getPronoun(pronoun.value)
            prettifyPronouns += await getOpinion(pronoun.opinion) + " " + infoPronoun.name + "\n"
        }
        embed.addFields({
            name: "Pronouns", value: prettifyPronouns, inline: true
        })
    }
    if (profile.flags){
        let flags = []
        for (let flag of profile.flags){
            flag = flag.replace("_", "")
            if (flag in flags) continue;
            flags.push(flag)
        }
        if (profile.customFlags) {
            for (let flag of profile.customFlags){
                let flagName = flag.name.replace("_", "")
                if (flagName in flags) continue;
                flags.push(flagName)
            }
        }
        embed.addFields({
            name: "Flags", value: flags.join("\n"), inline: true
        })
    }
    if (profile.timezone) {
        embed.addFields({
            name:"Timezone", value: profile.timezone.tz, inline: true
        })
    }
    if (profile.circle) {
        let prettifyCircle = ""
        for (let person of profile.circle){
            prettifyCircle += (person.circleMutual ? "✅" : "") + person.username + " - " + person.relationship
        }
        if (prettifyCircle) embed.addFields({
            name: "Circle", value: prettifyCircle, inline: true
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
            .setCustomId(`W_${ppuserId}_${locale}`)
            .setLabel("Words")
            .setStyle(ButtonStyle.Secondary)
        )
        if (profileLocales.length > 1){
            let length = profileLocales.length-currentIndex < 5 ? profileLocales.length-currentIndex : 4
            for (let i = 1; i<length + 1; i++) actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`P_${ppuserId}_${profileLocales[currentIndex+i]}`)
                .setLabel(await getLanguage(profileLocales[currentIndex + i], int.locale))
                .setStyle(ButtonStyle.Primary)
            )
        }
    } else if (currentIndex - 2 < 0) {
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`P_${ppuserId}_${profileLocales[currentIndex-1]}`)
            .setLabel(await getLanguage(profileLocales[currentIndex - 1], int.locale))
            .setStyle(ButtonStyle.Primary)
        )
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`W_${ppuserId}_${locale}`)
            .setLabel("Words")
            .setStyle(ButtonStyle.Secondary)
        )
        if (profileLocales.length > 2){
            let length = profileLocales.length-currentIndex < 4 ? profileLocales.length-currentIndex : 3
            for (let i = 1; i<length+1; i++) actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`P_${ppuserId}_${profileLocales[currentIndex+i]}`)
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
                .setCustomId(`P_${ppuserId}_${profileLocales[currentIndex-i]}`)
                .setLabel(await getLanguage(profileLocales[currentIndex - i], int.locale))
                .setStyle(ButtonStyle.Primary)
            )
        }
        actionRow.addComponents(
            new ButtonBuilder()
            .setCustomId(`W_${ppuserId}_${locale}`)
            .setLabel("Words")
            .setStyle(ButtonStyle.Secondary)
        )
        // recalculate how many after
        length = Math.abs(2-length)
        if (length > 0){
            for (let i = 1; i<length + 1; i++) actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`P_${ppuserId}_${profileLocales[currentIndex+i]}`)
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