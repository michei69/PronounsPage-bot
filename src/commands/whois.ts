import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import PronounsPageApi from "../api/PronounsPage";
import LazyDatabase from "../database";
import localeHelper from "../localeHelper";
import embedclr from "../utils/embedclr";
import getLanguage from "../utils/getLanguage";
import getUrl from "../utils/getUrl";
import LanguageUtil from "../utils/languageUtil";

const PPApi = new PronounsPageApi()
const db = new LazyDatabase()

const transHelper = new localeHelper()
const translations = transHelper.LoadForCommand("whois")
const langUtil = new LanguageUtil(translations)

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
        langUtil.update(int.locale)

        let user = int.options.getUser("user")
        if (user.bot){
            return await int.reply({embeds: [
                new EmbedBuilder()
                .setTitle(langUtil.get("isBot"))
                .setDescription(langUtil.get("isBotDesc").replace("\\n", "\n"))
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
                {name: langUtil.get("joined"), value:`<t:${userJoined}>`, inline: true},
                {name: langUtil.get("created"), value:`<t:${userCreated}>`, inline: true}
            ])
            .setAuthor({
                name: user.tag,
                iconURL: user.avatarURL()
            })
            .setFooter({
                text: langUtil.get("userId").replace("%id%", user.id)
            })
            .setColor(embedclr)
        if (!results || results.length < 1) {
            return await int.reply({
                embeds: [embed.setDescription(langUtil.get("noAcc"))],
                ephemeral: true
            })
        }
        embed.setTitle(results.username)
        let ppuser = await PPApi.getUser(results.username)
        if (!ppuser || !ppuser.id) return await int.reply({
            embeds: [embed.setDescription(`${results ? langUtil.get("invalid") : langUtil.get("noAcc")}`)],
            ephemeral: true
        })
        
        embed.setFooter({
            text: `${
                langUtil.get("userId").replace("%id%", user.id)
            }; ${langUtil.get("accId").replace("%id%", ppuser.id)}`
        })

        // should never run, non-admins dont have access to banned accounts
        if (ppuser.bannedBy) embed.addFields({
            name: langUtil.get("banned"), value: ppuser.bannedReason
        })

        let profiles = []
        for (let profile in ppuser.profiles) {
            profiles.push(`[${await getLanguage(profile, int.locale)}](https://${getUrl(profile)}/@${ppuser.username})`)
        }

        let yesWord = langUtil.getGeneric("yes")
        let noWord = langUtil.getGeneric("no")

        embed.addFields([{
            name: langUtil.get("team"), value: ppuser.team == 1 ? yesWord : noWord, inline: true
        }, {
            name: langUtil.get("profiles"), value: profiles.join("\n"), inline: false
        }])

        let actionRow = new ActionRowBuilder<ButtonBuilder>()
        let count = 1
        for (let profile in ppuser.profiles){
            if (count > 5) break;
            actionRow.addComponents(
                new ButtonBuilder()
                .setCustomId(`P_${ppuser.id}_${profile}`)
                .setLabel(await getLanguage(profile, int.locale))
                .setStyle(ButtonStyle.Primary)
            )
            count++;
        }

        return await int.reply({
            embeds: [embed],
            ephemeral: true,
            components: [actionRow]
        })
    }
}