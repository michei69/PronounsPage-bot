export default (locale: string) => {
    switch (locale){
        case "pl": return "zaimki.pl"
        case "es": return "pronombr.es"
        case "fr": return "pronoms.fr"
        default: return locale + ".pronouns.page"
    }
}