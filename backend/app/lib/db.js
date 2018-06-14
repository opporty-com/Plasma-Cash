import levelup from 'levelup';
import leveldown from 'leveldown';
const levelDB = levelup(leveldown('/Users/vladimirkovalcuk/Plasma-Cash/data/leveldb/data'));

module.exports = levelDB;
