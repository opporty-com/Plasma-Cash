/**
 * Created by Oleksandr <alex@moonion.com> on 28.10.2019
 * moonion.com;
 */

import redis from "./redis";
import mongo from "./mongo";

const db = process.env.DB_ADAPTER === 'mongo' ? mongo(process.env.DB_URI) : redis();

export default db;
