import levelup from 'levelup';
import leveldown from 'leveldown';
const levelDB = levelup(leveldown('/var/lib/leveldb/data'));

module.exports = levelDB;
