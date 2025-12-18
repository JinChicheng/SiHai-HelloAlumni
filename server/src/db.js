import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

let db;
let SQL;
let dbDirty = false;

export const getDb = () => {
  if (!db) throw new Error("DB not initialized");
  return db;
};

export const initDb = async () => {
  const wasmPath = "node_modules/sql.js/dist/sql-wasm.wasm";
  SQL = await initSqlJs({ locateFile: () => wasmPath });
  const dbPath = process.env.DB_PATH || "./data/alumni.db";
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(filebuffer));
  } else {
    db = new SQL.Database();
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      graduation_year INTEGER,
      alumni_identity_id TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alumni_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      school TEXT,
      college TEXT,
      major TEXT,
      degree TEXT,
      city TEXT,
      district TEXT,
      address TEXT,
      address_en TEXT,
      country TEXT,
      lat REAL,
      lng REAL,
      privacy_level TEXT DEFAULT 'district',
      job_title TEXT,
      company TEXT,
      industry TEXT,
      industry_segment TEXT,
      is_startup INTEGER DEFAULT 0,
      business_domain TEXT,
      funding_stage TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      skills TEXT,
      resources TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS live_locations (
      user_id INTEGER UNIQUE NOT NULL,
      lat REAL,
      lng REAL,
      campus TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      location_name TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      contact_name TEXT,
      contact_phone TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      funding_target REAL NOT NULL,
      funding_stage TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL,
      lng REAL,
      alumni_id_verification TEXT NOT NULL,
      project_materials TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS welfare_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      project_type TEXT NOT NULL,
      location_name TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      created_at TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS welfare_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      meet_location TEXT,
      meet_lat REAL,
      meet_lng REAL,
      created_at TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES welfare_projects(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS welfare_team_members (
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (team_id, user_id),
      FOREIGN KEY(team_id) REFERENCES welfare_teams(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS welfare_footprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      participation_date TEXT NOT NULL,
      participation_type TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(project_id) REFERENCES welfare_projects(id)
    );
  `);
  // Ensure columns exist for existing databases (SQLite allows ALTER ADD COLUMN)
  const cols = all("PRAGMA table_info(alumni_profiles)").map(r => r.name);
  const addCol = (name, sql) => {
    if (!cols.includes(name)) {
      db.exec(sql);
    }
  };
  addCol("address_en", "ALTER TABLE alumni_profiles ADD COLUMN address_en TEXT;");
  addCol("country", "ALTER TABLE alumni_profiles ADD COLUMN country TEXT;");
  addCol("industry_segment", "ALTER TABLE alumni_profiles ADD COLUMN industry_segment TEXT;");
  addCol("is_startup", "ALTER TABLE alumni_profiles ADD COLUMN is_startup INTEGER DEFAULT 0;");
  addCol("business_domain", "ALTER TABLE alumni_profiles ADD COLUMN business_domain TEXT;");
  addCol("funding_stage", "ALTER TABLE alumni_profiles ADD COLUMN funding_stage TEXT;");
  addCol("contact_name", "ALTER TABLE alumni_profiles ADD COLUMN contact_name TEXT;");
  addCol("contact_phone", "ALTER TABLE alumni_profiles ADD COLUMN contact_phone TEXT;");
  addCol("contact_email", "ALTER TABLE alumni_profiles ADD COLUMN contact_email TEXT;");
  addCol("office_address", "ALTER TABLE alumni_profiles ADD COLUMN office_address TEXT;");
  addCol("office_lat", "ALTER TABLE alumni_profiles ADD COLUMN office_lat REAL;");
  addCol("office_lng", "ALTER TABLE alumni_profiles ADD COLUMN office_lng REAL;");
  addCol("wechat", "ALTER TABLE alumni_profiles ADD COLUMN wechat TEXT;");
  addCol("qq", "ALTER TABLE alumni_profiles ADD COLUMN qq TEXT;");

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alumni_industry ON alumni_profiles(industry);
    CREATE INDEX IF NOT EXISTS idx_alumni_industry_segment ON alumni_profiles(industry_segment);
    CREATE INDEX IF NOT EXISTS idx_alumni_city_district ON alumni_profiles(city, district);
    CREATE INDEX IF NOT EXISTS idx_alumni_country ON alumni_profiles(country);
    CREATE INDEX IF NOT EXISTS idx_alumni_startup ON alumni_profiles(is_startup, funding_stage, business_domain);
  `);
  saveDb(dbPath);
};

export const saveDb = (dbPathArg) => {
  const dbPath = dbPathArg || process.env.DB_PATH || "./data/alumni.db";
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  dbDirty = false;
};

export const run = (sql, params = {}) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.run();
  stmt.free();
  dbDirty = true;
};

export const get = (sql, params = {}) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

export const all = (sql, params = {}) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};
