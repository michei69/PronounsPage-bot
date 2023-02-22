import axios from "axios"

interface Pronoun {
    canonicalName: string,
    description: string,
    normative: boolean,
    morphemes: object,
    pronounciations: object,
    plural: Array<boolean>,
    pluralHonorific: Array<boolean>,
    aliases: Array<string>,
    history: string,
    pronounceable: boolean,
    thirdForm: string | null,
    smallForm: string | null,
    sourcesInfo: string | null,
    examples: Array<string>,
    name: string | undefined
}
interface PronounsData {
    [key: string]: Pronoun
}

interface Source {
    id: number,
    locale: string,
    pronouns: string,
    type: string,
    author: string,
    title: string,
    extra: string,
    year: number,
    fragments: string,
    comment: string | null,
    link: string | null,
    submitter_id: number,
    approved: number,
    deleted: number,
    base_id: number | null,
    key: string | null,
    images: string | null,
    spoiler: number,
    submitter: string,
    versions: Array<Source> | undefined
}

interface Noun {
    id: string,
    masc: string,
    fem: string,
    neutr: string,
    mascPl: string,
    femPl: string,
    neutrPl: string,
    approved: number,
    base_id: string | null,
    locale: string,
    author_id: string,
    deleted: number,
    sources: string,
    author: string,
    sourcesData: Array<Source>
}

interface InclusiveEntry {
    id: string,
    insteadOf: string,
    say: string,
    because: string,
    locale: string,
    approved: number,
    base_id: string | null,
    author_id: string,
    categories: string,
    links: any, // currently string but looks like a bug imo
    deleted: number,
    clarification: string | null,
    author: string
}

interface Term {
    id: string,
    term: string,
    original: string,
    definition: string,
    locale: string,
    approved: number,
    base_id: string | null,
    author_id: string,
    deleted: number,
    flags: string, //again, weird decision? looks like json inside a string for me
    category: string,
    images: string,
    key: string,
    author: string,
    versions: Array<Term>
}


interface Opinion {
    icon: string,
    description: string,
    colour: string,
    style: string
}
interface Name {
    value: string,
    opinion: string
}
interface LinkData {
    favicon: string,
    relMe: Array<any>, // no idea
    nodeInfo: any | null
}
interface WordColumn {
    header: string,
    values: Array<Name>
}
interface Relationship {
    username: string,
    avatar: string,
    circleMutual: boolean,
    locale: string,
    relationship: string
}
interface Profile {
    opinions: {
        [key: string]: Opinion
    },
    names: Array<Name>,
    pronouns: Array<Name>,
    description: string,
    age: number | null,
    links: Array<string>,
    linksMetadata: {
        [key: string]: LinkData
    },
    verifiedLinks: {
        [key: string]: string
    },
    flags: Array<string>,
    customFlags: Array<string>,
    words: Array<WordColumn>,
    birthday: any | null, // no idea what kind birthday is - useless for bot anyway
    timezone: {
        tz: string,
        area: boolean,
        loc: boolean
    },
    teamName: string | null,
    footerName: string | null,
    footerAreas: Array<string>,
    // no idea
    credentials: Array<any>,
    credentialsLevel: any | null,
    credentialsName: any | null,
    //
    card: string | null,
    cardDark: string | null,
    circle: Array<Relationship>,
    sensitive: Array<any> //???
}
interface User {
    id: string,
    username: string,
    avatarSource: string,
    bannedReason: string | null,
    bannedTerms: Array<string>,
    bannedBy: string,
    team: number,
    emailHash: string,
    avatar: string,
    profiles: {
        [key: string]: Profile
    }
}

interface CalendarEvent {
    name: string,
    flag: string | null,
    month: number,
    level: number,
    terms: Array<string>,
    timeDescription: any | null,
    localCalendar: any | null
}
interface CalendarDay {
    day: string,
    link: string,
    image: string,
    message: string | null,
    events: Array<string>,
    eventsRaw: Array<CalendarEvent>
}

export default class PronounsPageApi {
    language: string
    private url: string

    constructor(language?: string){
        this.language = language || "en"
        this.language = this.language.toLowerCase()
        this.url = `https://${this.language}.pronouns.page/api`
        if (this.language == "pl") this.url = "https://zaimki.pl/api"
    }

    async getPronouns(): Promise<PronounsData | null>{
        try{
            let { data, status } = await axios.get<PronounsData>(`${this.url}/pronouns`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log("Error while fetching pronouns:", err.message)
            } else {
                console.log("Unexpected error fetching pronouns:", err)
            }
            return null
        }
    }
    async getPronoun(pronoun: string): Promise<Pronoun | null>{
        try{
            let { data, status } = await axios.get<Pronoun | null>(`${this.url}/pronouns/${pronoun}`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching pronoun "${pronoun}": ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching pronoun "${pronoun}": ${err}`)
            }
        }
    }

    async getSources(): Promise<Array<Source> | null>{
        try {
            let { data, status } = await axios.get<Array<Source>>(`${this.url}/sources`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching sources: ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching sources: ${err}`)
            }
            return null
        }
    }
    async getSource(sourceId: string): Promise<Array<Source> | null> {
        try {
            let { data, status } = await axios.get<Array<Source>>(`${this.url}/sources/${sourceId}`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching sources: ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching sources: ${err}`)
            }
            return null
        }
    }

    async getNouns(): Promise<Array<Noun> | null> {
        try {
            let { data, status } = await axios.get<Array<Noun>>(`${this.url}/nouns`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching nouns: ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching nouns: ${err}`)
            }
            return null
        }
    }
    async getNoun(term: string): Promise<Array<Noun> | null> {
        try {
            let { data, status } = await axios.get<Array<Noun>>(`${this.url}/nouns/search/${term}`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching noun "${term}": ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching noun "${term}": ${err}`)
            }
            return null
        }
    }

    async getInclusiveEntries(): Promise<Array<InclusiveEntry> | null> {
        try {
            let { data, status } = await axios.get<Array<InclusiveEntry>>(`${this.url}/inclusive`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching inclusives: ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching inclusives: ${err}`)
            }
            return null
        }
    }
    async getInclusiveEntry(term: string): Promise<Array<InclusiveEntry> | null> {
        try {
            let { data, status } = await axios.get<Array<InclusiveEntry>>(`${this.url}/inclusive/search/${term}`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching inclusive "${term}": ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching inclusive "${term}": ${err}`)
            }
            return null
        }
    }

    async getTerms(): Promise<Array<Term> | null> {
        try {
            let { data, status } = await axios.get<Array<Term>>(`${this.url}/terms`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching terms: ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching terms: ${err}`)
            }
            return null
        }
    }
    async getTerm(term: string): Promise<Array<Term> | null> {
        try {
            let { data, status } = await axios.get<Array<Term>>(`${this.url}/terms/search/${term}`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching term "${term}": ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching term "${term}": ${err}`)
            }
            return null
        }
    }

    async getUser(username: string): Promise<User | null> {
        try {
            let { data, status } = await axios.get<User>(`${this.url}/profile/get/${username}?version=2`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching user "${username}": ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching user "${username}": ${err}`)
            }
            return null
        }
    }
    async getUserById(userId: string): Promise<User | null> {
        try {
            let { data, status } = await axios.get<User>(`${this.url}/profile/get-id/${userId}?version=2`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching user "${userId}": ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching user "${userId}": ${err}`)
            }
            return null
        }
    }

    async getCurrentEvents(): Promise<CalendarDay | null> {
        try {
            let { data, status } = await axios.get<CalendarDay>(`${this.url}/calendar/today`)
            return data
        } catch (err) {
            if (axios.isAxiosError(err)){
                console.log(`Error while fetching events: ${err.message}`)
            } else {
                console.log(`Unexpected error while fetching events: ${err}`)
            }
            return null
        }
    }
}