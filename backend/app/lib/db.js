import levelParty from "level-party";

const db = levelParty("/var/lib/leveldb/data");

export default db;
