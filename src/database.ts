import { Database } from "sqlite3";
import { open as sqlOpen, Database as sqlDB} from "sqlite"

// taken from pronouns.page - https://gitlab.com/PronounsPage/PronounsPage/-/blob/main/server/db.js && index.js
// could add custom database string but no need
export default class LazyDatabase {
    db: sqlDB
    constructor(){
        this.db = null
    }
    async init() {
        if (this.db) return;
        this.db = await sqlOpen({
            filename: "./db.sqlite",
            driver: Database //sqlite3
        })
        await this.db.get("PRAGMA busy_timeout = 5000;")
    }

    async get(...args) {
        await this.init()
        // @ts-ignore
        return this.db.get(...args)
    }
    async all(...args) {
        await this.init()
        // @ts-ignore
        return this.db.all(...args)
    }
    async close() {
        if (!this.db) return;
        try{
            await this.db.close()
        } catch {}
    }
}