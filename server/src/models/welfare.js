import { get, all, run, saveDb } from "../db.js";

export const createWelfareProject = (data) => {
  const now = new Date().toISOString();
  run(
    `INSERT INTO welfare_projects (title, description, project_type, location_name, address, lat, lng, contact_name, contact_phone, contact_email, created_at, created_by)
     VALUES ($title, $description, $project_type, $location_name, $address, $lat, $lng, $contact_name, $contact_phone, $contact_email, $created_at, $created_by)`,
    {
      $title: data.title,
      $description: data.description,
      $project_type: data.project_type,
      $location_name: data.location_name,
      $address: data.address,
      $lat: data.lat,
      $lng: data.lng,
      $contact_name: data.contact_name,
      $contact_phone: data.contact_phone,
      $contact_email: data.contact_email,
      $created_at: now,
      $created_by: data.created_by
    }
  );
  saveDb();
  return get(`SELECT * FROM welfare_projects WHERE id = last_insert_rowid()`);
};

export const getAllWelfareProjects = () => {
  return all(`SELECT * FROM welfare_projects ORDER BY created_at DESC`);
};

export const getWelfareProjectById = (id) => {
  return get(`SELECT * FROM welfare_projects WHERE id = $id`, { $id: id });
};

export const deleteWelfareProject = (id) => {
  const project = getWelfareProjectById(id);
  if (!project) return null;
  run(`DELETE FROM welfare_projects WHERE id = $id`, { $id: id });
  run(`DELETE FROM welfare_teams WHERE project_id = $id`, { $id: id });
  run(`DELETE FROM welfare_team_members WHERE team_id IN (SELECT id FROM welfare_teams WHERE project_id = $id)`, { $id: id });
  run(`DELETE FROM welfare_footprints WHERE project_id = $id`, { $id: id });
  saveDb();
  return project;
};

export const createWelfareTeam = (data) => {
  const now = new Date().toISOString();
  run(
    `INSERT INTO welfare_teams (project_id, title, description, start_time, end_time, meet_location, meet_lat, meet_lng, created_at, created_by)
     VALUES ($project_id, $title, $description, $start_time, $end_time, $meet_location, $meet_lat, $meet_lng, $created_at, $created_by)`,
    {
      $project_id: data.project_id,
      $title: data.title,
      $description: data.description,
      $start_time: data.start_time,
      $end_time: data.end_time,
      $meet_location: data.meet_location,
      $meet_lat: data.meet_lat,
      $meet_lng: data.meet_lng,
      $created_at: now,
      $created_by: data.created_by
    }
  );
  saveDb();
  return get(`SELECT * FROM welfare_teams WHERE id = last_insert_rowid()`);
};

export const getAllWelfareTeams = () => {
  return all(`SELECT * FROM welfare_teams ORDER BY created_at DESC`);
};

export const getWelfareTeamsByProjectId = (projectId) => {
  return all(`SELECT * FROM welfare_teams WHERE project_id = $project_id ORDER BY created_at DESC`, { $project_id: projectId });
};

export const getWelfareTeamById = (id) => {
  return get(`SELECT * FROM welfare_teams WHERE id = $id`, { $id: id });
};

export const joinWelfareTeam = (teamId, userId) => {
  const now = new Date().toISOString();
  run(
    `INSERT OR IGNORE INTO welfare_team_members (team_id, user_id, joined_at)
     VALUES ($team_id, $user_id, $joined_at)`,
    {
      $team_id: teamId,
      $user_id: userId,
      $joined_at: now
    }
  );
  saveDb();
  return get(`SELECT * FROM welfare_team_members WHERE team_id = $team_id AND user_id = $user_id`, { $team_id: teamId, $user_id: userId });
};

export const getWelfareTeamMembers = (teamId) => {
  return all(
    `SELECT u.* FROM users u
     JOIN welfare_team_members wtm ON u.id = wtm.user_id
     WHERE wtm.team_id = $team_id`,
    { $team_id: teamId }
  );
};

export const createWelfareFootprint = (data) => {
  const now = new Date().toISOString();
  run(
    `INSERT INTO welfare_footprints (user_id, project_id, participation_date, participation_type, description, created_at)
     VALUES ($user_id, $project_id, $participation_date, $participation_type, $description, $created_at)`,
    {
      $user_id: data.user_id,
      $project_id: data.project_id,
      $participation_date: data.participation_date,
      $participation_type: data.participation_type,
      $description: data.description,
      $created_at: now
    }
  );
  saveDb();
  return get(`SELECT * FROM welfare_footprints WHERE id = last_insert_rowid()`);
};

export const getWelfareFootprintsByUserId = (userId) => {
  return all(
    `SELECT wf.*, wp.title as project_title FROM welfare_footprints wf
     JOIN welfare_projects wp ON wf.project_id = wp.id
     WHERE wf.user_id = $user_id
     ORDER BY wf.participation_date DESC`,
    { $user_id: userId }
  );
};

export const getWelfareFootprintsByProjectId = (projectId) => {
  return all(
    `SELECT wf.*, u.name as user_name FROM welfare_footprints wf
     JOIN users u ON wf.user_id = u.id
     WHERE wf.project_id = $project_id
     ORDER BY wf.participation_date DESC`,
    { $project_id: projectId }
  );
};
