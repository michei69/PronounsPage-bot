import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import PronounsPageApi from "../api/PronounsPage";
import LazyDatabase from "../database";
import localeHelper from "../localeHelper";
import embedclr from "../utils/embedclr";

const PPApi = new PronounsPageApi()
const db = new LazyDatabase()

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("whois")

// prettify stuff
async function getLanguage(lang: string, locale: string){
    return translations["generic"][locale]["languages"][lang]

    // switch (lang) {
    //     case "de": return "German"
    //     case "en-US": return "English"
    //     case "eo": return "Esperanto"
    //     case "es": return "Spanish"
    //     case "fr": return "French"
    //     case "gl": return "Galician"
    //     case "it": return "Italian"
    //     case "ja": return "Japanese"
    //     case "ko": return "Korean"
    //     case "lad": return "Ladino"
    //     case "nl": return "Dutch"
    //     case "no": return "Norwegian"
    //     case "pl": return "Polish"
    //     case "pt": return "Portuguese"
    //     case "ro": return "Romanian"
    //     case "ru": return "Russian"
    //     case "sv": return "Swedish"
    //     case "tok": return "Toki-Pona"
    //     case "tr": return "Turkish"
    //     case "ua": return "Ukrainian"
    //     case "vi": return "Vietnamese"
    //     case "yi": return "Yiddish"
    //     case "zh": return "Mandarin"
    // }
}

export default {
    data: new SlashCommandBuilder()
        .setName("whois")
        .setDescription("Gets information about a user")
        .setDescriptionLocalizations(translations["description"])
        .addUserOption(
            opt=>opt
            .setName("user")
            .setNameLocalizations(translations["userName"])
            .setDescription("The user specified")
            .setDescriptionLocalizations(translations["userDesc"])
            .setRequired(true)
        ),
    async execute(int: ChatInputCommandInteraction) {
        let user = int.options.getUser("user")
        if (user.bot){
            return await int.reply({embeds: [
                new EmbedBuilder()
                .setTitle(translations["isBot"][int.locale] || translations["isBot"]["en-US"])
                .setDescription((translations["isBotDesc"][int.locale] || translations["isBotDesc"]["en-US"]).replace("\\n", "\n"))
                .setColor(embedclr)
                .setThumbnail("attachment://cross.png")
            ], files: ["./static/cross.png"], ephemeral: true})
        }
        let results = await db.get(`SELECT * FROM users WHERE id="${user.id}"`)

        let userJoined = (await int.guild.members.fetch(user.id)).joinedTimestamp / 1000
        let userCreated = user.createdTimestamp / 1000
        userJoined = Math.floor(userJoined)
        userCreated = Math.floor(userCreated)
        let embed = new EmbedBuilder()
            .setThumbnail(user.avatarURL())
            .addFields([
                {name: translations["joined"][int.locale] || translations["joined"]["en-US"], value:`<t:${userJoined}>`, inline: true},
                {name: translations["created"][int.locale] || translations["created"]["en-US"], value:`<t:${userCreated}>`, inline: true}
            ])
            .setAuthor({
                name: user.tag,
                iconURL: user.avatarURL()
            })
            .setFooter({
                text: (translations["userId"][int.locale] || translations["userId"]["en-US"]).replace("%id%", user.id)
            })
            .setColor(embedclr)
        if (!results || results.length < 1) {
            return await int.reply({
                embeds: [embed.setDescription(translations["noAcc"][int.locale] || translations["noAcc"]["en-US"])],
                ephemeral: true
            })
        }
        embed.setTitle(results.username)
        let ppuser = await PPApi.getUser(results.username)
        if (!ppuser || !ppuser.id) return await int.reply({
            embeds: [embed.setDescription(`${results ? (translations["invalid"][int.locale] || translations["invalid"]["en-US"]) : (translations["noAcc"][int.locale] || translations["noAcc"]["en-US"])}`)],
            ephemeral: true
        })
        
        embed.setFooter({
            text: `${
                (translations["userId"][int.locale] || translations["userId"]["en-US"]).replace("%id%", user.id)
            }; ${(translations["accId"][int.locale] || translations["accId"]["en-US"]).replace("%id%", ppuser.id)}`
        })

        if (ppuser.bannedBy) embed.addFields({
            name: translations["banned"][int.locale] || translations["banned"]["en-US"], value: ppuser.bannedReason
        })

        let profiles = []
        for (let profile in ppuser.profiles) {
            profiles.push(`[${await getLanguage(profile, int.locale)}](${profile == "pl" ? "zaimki.pl" : profile + ".pronouns.page"}/@${ppuser.username})`)
        }

        let yesWord = translations["generic"][int.locale]["yes"] || translations["generic"]["en-US"]["yes"]
        let noWord = translations["generic"][int.locale]["no"] || translations["generic"]["en-US"]["no"]

        embed.addFields([{
            name: translations["team"][int.locale] || translations["team"]["en-US"], value: ppuser.team == 1 ? yesWord : noWord, inline: true
        }, {
            name: translations["profiles"][int.locale] || translations["profiles"]["en-US"], value: profiles.join("\n"), inline: false
        }])

        return await int.reply({
            embeds: [embed],
            ephemeral: true
        })
    }
}