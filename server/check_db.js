
import { all, initDb } from './src/db.js';

await initDb();

const count = all("SELECT COUNT(1) AS c FROM alumni_profiles")[0].c;
console.log("Count:", count);

const overseas = all("SELECT * FROM alumni_profiles WHERE country IS NOT NULL LIMIT 5");
console.log("Overseas sample:", overseas.map(o => ({ city: o.city, lat: o.lat, lng: o.lng })));
