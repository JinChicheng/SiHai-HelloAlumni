
import { run, initDb, saveDb } from './src/db.js';

await initDb();

console.log("Deleting all data...");
run("DELETE FROM alumni_profiles");
run("DELETE FROM users");
saveDb();
console.log("Data deleted and saved.");
