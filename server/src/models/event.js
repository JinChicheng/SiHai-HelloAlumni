import { get, all, run, saveDb } from "../db.js";

export const createEvent = (data) => {
  const now = new Date().toISOString();
  run(
    `INSERT INTO events (title, description, start_time, end_time, location_name, address, lat, lng, created_at)
     VALUES ($title, $description, $start_time, $end_time, $location_name, $address, $lat, $lng, $created_at)`,
    {
      $title: data.title,
      $description: data.description,
      $start_time: data.start_time,
      $end_time: data.end_time,
      $location_name: data.location_name,
      $address: data.address,
      $lat: data.lat,
      $lng: data.lng,
      $created_at: now
    }
  );
  saveDb();
  return get(`SELECT * FROM events WHERE id = last_insert_rowid()`);
};

export const getAllEvents = () => {
  return all(`SELECT * FROM events ORDER BY start_time DESC`);
};

export const getEventById = (id) => {
  return get(`SELECT * FROM events WHERE id = $id`, { $id: id });
};

export const deleteEvent = (id) => {
  const event = getEventById(id);
  if (!event) return null;
  run(`DELETE FROM events WHERE id = $id`, { $id: id });
  saveDb();
  return event;
};
