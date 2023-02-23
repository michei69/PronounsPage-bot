export default class LanguageUtil{
    private translations: object
    private locale: string
    constructor(translations: object){
        this.translations = translations
    }
    get(property: string): string {
        return this.translations[property][this.locale] || this.translations[property]["en-US"]
    }
    getGeneric(property: string): string {
        return this.translations["generic"][this.locale][property] || this.translations["generic"]["en-US"][property]
    }
    update(locale: string){
        this.locale = locale
    }
}