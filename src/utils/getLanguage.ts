import localeHelper from "../localeHelper";

let transHelper = new localeHelper()
let translations = transHelper.LoadAll()

export default async (lang: string, locale: string) => {
    locale = (locale == "en-US" || locale == "en-GB") ? "en" : locale
    return translations[locale]["languages"][lang]
}