import PronounsPageApi, {User, Profile} from "../api/PronounsPage"
import localeHelper from "../localeHelper"
import LanguageUtil from "./languageUtil"

interface ExportedUser{
    user: User | null,
    profile: Profile | null,
    description: string | null,
    names: string | null,
    pronouns: string | null,
    flags: string | null,
    timezone: string | null,
    circle: string | null
} // no words cause those r fetched easier right from the interaction

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

export default async (userId: string, locale: string, userLocale?: string): Promise<ExportedUser> => {
    langUtil.update(userLocale || "en-US")
    
    let newUser: ExportedUser = <ExportedUser>{}
    
    var PPApi = new PronounsPageApi(locale)
    let ppUser = await PPApi.getUserById(userId)
    newUser.user = ppUser
    if (!newUser.user || !newUser.user.id) return null // basically no user
    if (!(locale in ppUser.profiles)) 
        return newUser // return just the user - has no profile
    
    newUser.profile = ppUser.profiles[locale]

    let profile = ppUser.profiles[locale]
    if (profile.description) newUser.description = profile.description
    
    if (profile.names) {
        newUser.names = ""
        let count = 0
        for (let name of profile.names) { // v2 profile - TODO: add fallback for v1
            count++;
            if (count > 15) {
                newUser.names += langUtil.getGeneric("andMore").replace("%count%", profile.names.slice(count).length.toString())
                break;
            }
            newUser.names += `${await getOpinion(name.opinion)} ${name.value}\n`
        }
        if (!newUser.names) newUser.names = null // reset to null if none
    }
    if (profile.pronouns) {
        newUser.pronouns = ""
        let count = 0
        for (let pronoun of profile.pronouns){
            count++;
            if (count > 15) {
                newUser.pronouns += langUtil.getGeneric("andMore").replace("%count%", profile.pronouns.slice(count).length.toString())
                break;
            }
            let infoPronoun = await PPApi.getPronoun(pronoun.value)
            newUser.pronouns += `${await getOpinion(pronoun.opinion)} ${infoPronoun.name}\n`
        }
        if (!newUser.pronouns) newUser.pronouns = null
    }
    if (profile.flags) {
        let flagsList = []
        let count = 0
        let left = 0
        for (let flag of profile.flags) {
            flag = flag.replace("_", "") // clear for multiples (eg: Gay, Gay_, Gay__)
            if (flag in flagsList) continue;
            count++;
            if (count > 20) {
                left = profile.flags.slice(count).length
                break;
            }
            flagsList.push(flag)
        }
        if (profile.customFlags){
            for (let flag of profile.customFlags) {
                let flagName = flag.name.replace("_", "") // customs may not have _ but still
                if (flagName in flagsList) continue;
                count++;
                if (count > 20) {
                    left += profile.flags.slice(count).length
                    break;
                }
                flagsList.push(flagName)
            }
        }
        let more = langUtil.getGeneric("andMore")
        newUser.flags = flagsList.join("\n") 
        if (left) {
            newUser.flags += `\n${more.replace("%count%", left.toString())}`
        }
        if (!flagsList) newUser.flags = null
    }
    if (profile.timezone) newUser.timezone = profile.timezone.tz
    if (profile.circle){
        newUser.circle = ""
        let count = 0
        for (let person of profile.circle) {
            count++
            if (count > 15){
                newUser.circle += langUtil.getGeneric("andMore").replace("%count%", profile.circle.slice(count).length.toString())
                break;
            }
            newUser.circle += `${person.circleMutual ? "✅ " : ""}${person.username} - ${person.relationship}\n`
        }
        if (!newUser.circle) newUser.circle = null
    }
    return newUser
}