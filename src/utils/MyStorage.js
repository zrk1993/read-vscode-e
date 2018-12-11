const Fs = require('fs');
const Path = require('path');

class MyStorage {
    constructor({ rootPath }) {
        try {
            this.dataStoragePath = Path.join(rootPath, 'src/utils/storageData.txt');          
            let data = Fs.readFileSync(this.dataStoragePath, 'utf8');
            if (!data) data = '{}';
            this._data = JSON.parse(data);
        } catch (error) {
            debugger
        }
    }

    setItem(key, value) {
        this._data[key] = value;
        this._save();
    }
    
    getItem(key) {
        return this._data[key];
    }
    
    removeItem(key) {
        delete this._data[key];
        this._save();
    }
    
    _save() {
        const data = JSON.stringify(this._data);
        Fs.writeFileSync(this.dataStoragePath, data);
    }
}

module.exports = MyStorage;