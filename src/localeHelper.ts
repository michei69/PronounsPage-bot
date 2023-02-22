import Suml from "suml" // no decl = no autocomplete, sad
import fs from "node:fs"

const suml = new Suml()

// https://discord.com/developers/docs/reference#locales
const USE_EN_FOR_BOTH_US_AND_GB = true

// loading translations into memory
export default class Translations {
    translations: {
        [key: string]: string | object
    }
    constructor() {
        this.translations = {}
        for (let file of fs.readdirSync(__dirname + "/locales")){
            this.translations[file.replace(".suml", "")] = fs.readFileSync(__dirname + "/locales/" +file).toString()
        }
        this.init()
    }
    init() {
        for (let translation in this.translations){
            this.translations[translation] = suml.parse(this.translations[translation])
        }
    }
    Load(lang: string): object | undefined | null { 
        return this.translations[lang] as object
    }
    LoadAll(): object | undefined | null {
        return this.translations
    }
    LoadForCommand(cmd: string): object | undefined | null {
        try{
            if (!this.translations["en"]) this.init()
            let cmdTrans = {}
            cmdTrans["generic"] = {}
            for (let t in this.translations){
                if (t == "en" && USE_EN_FOR_BOTH_US_AND_GB){
                    for (let i in this.translations[t]["commands"][cmd]) {
                        cmdTrans[i] = cmdTrans[i] || {}
                        cmdTrans[i]["en-US"] = this.translations[t]["commands"][cmd][i]
                        cmdTrans[i]["en-GB"] = cmdTrans[i]["en-US"]
                    }
                    cmdTrans["generic"]["en-US"] = {
                        error: this.translations[t]["error"],
                        success: this.translations[t]["success"],
                        yes: this.translations[t]["yes"],
                        no: this.translations[t]["no"],
                        languages: this.translations[t]["languages"],
                    }
                    cmdTrans["generic"]["en-GB"] = cmdTrans["generic"]["en-US"]
                    continue
                }
                for (let i in this.translations[t]["commands"][cmd]) {
                    cmdTrans[i] = cmdTrans[i] || {}
                    cmdTrans[i][t] = this.translations[t]["commands"][cmd][i]
                    // if (!cmdTrans[i][t]) cmdTrans[i][t] = this.translations["en"]["commands"][cmd][i] // for some reason undefined refuses to work???
                }
                cmdTrans["generic"][t] = {
                    error: this.translations[t]["error"],
                    success: this.translations[t]["success"],
                    yes: this.translations[t]["yes"],
                    no: this.translations[t]["no"],
                    languages: this.translations[t]["languages"],
                }
            }
            return cmdTrans
        } catch (err) {
            console.error(err)
            return null
        }
    }
}