const fs = require('fs')

const ensureExists = (path) => {
    if (!fs.existsSync(path)) {
        const data = '[]'
        fs.writeFileSync(path, data)
    }
}

const save = (data, path) => {
    const s = JSON.stringify(data, null, 2)
    fs.writeFileSync(path, s)
}

const load = (path) => {
    const options = {
        encoding: 'utf8',
    }
    ensureExists(path)
    const s = fs.readFileSync(path, options)
    const data = JSON.parse(s)
    return data
}

class Model {
    static dbPath() {
        const classname = this.name.toLowerCase()
        const path = require('path')
        const filename = `${classname}.txt`
        const p = path.join(__dirname, '../db', filename)
        return p
    }

    static _newFromDict(dict) {
        const cls = this
        const m = new cls(dict)
        return m
    }

    static all() {
        const path = this.dbPath()
        const models = load(path)
        const ms = models.map((m) => {
            const cls = this
            // 之前的写法是
            // const instance = cls.create(m)
            // 这样的话会出现递归调用的情况
            // 因为 create 里会调用 save 方法, save 方法里又会调用 all 方法
            // 即 all -> create -> save -> all
            // 为了避免这种情况, 用一个新方法来生成实例
            const instance = cls._newFromDict(m)
            return instance
        })
        return ms
    }

    static create(form={}) {
        const cls = this
        const instance = new cls(form)
        instance.save()
        // save 之后, 微博的数据就已经在数据库中了
        return instance
    }

    static findOne(arg1, arg2) {
        const res = this.find(arg1, arg2)
        return res.length > 0 ? res[0] : null
    }

    static find(arg1, arg2) {
        if (typeof arg1 === 'object') {
            return this._fetch(arg1)
        }else {
            return this._fetchBy(arg1, arg2)
        }
    }

    static get(id) {
        return this.findOne('id', id)
    }

    static _contains(obj1, obj2) {
        let contains = true
        Object.keys(obj2).forEach(k => {
            if (!obj1[k] || obj2[k] !== obj1[k]) {
                contains = false
            }
        })
        return contains
    }

    static _fetch(query) {
        return this.all().filter(m => this._contains(m, query))
    }

    static  _fetchBy(key, value) {
        const query = {}
        query[key] = value
        return this._fetch(query)
    }

    save() {
        const cls = this.constructor
        const models = cls.all()
        if (this.id === undefined) {
            if (models.length > 0) {
                const last = models[models.length - 1]
                this.id = last.id + 1
            } else {
                // 0 在 js 中会被处理成 false, 第一个元素的 id 设置为 1, 方便处理
                this.id = 1
            }
            models.push(this)
        } else {
            const index = models.findIndex((e) => {
                return e.id === this.id
            })
            if (index > -1) {
                models[index] = this
            }
        }
        const path = cls.dbPath()
        save(models, path)
    }

    static remove(id) {
        const cls = this
        const models = cls.all()
        const index = models.findIndex((e) => {
            return e.id === id
        })
        if (index > -1) {
            models.splice(index, 1)
        }
        const path = cls.dbPath()
        save(models, path)
        return
    }

    toString() {
        const s = JSON.stringify(this, null, 2)
        return s
    }
}

const test = () => {
    var obj1 = {
        "id": 1,
        "username": "gua",
        "password": "123",
        "note": "python"
    }
    var obj2 = {
        username: 'gua',
        password: '123',
    }
    var obj3 = {
        username: 'gua',
        password: '666',
    }

    const a = Model._contains(obj1,obj2)
    const b = Model._contains(obj1,obj3)
    console.log(a)
    console.log(b)
}


if (require.main === module) {
    test()
}

module.exports = Model