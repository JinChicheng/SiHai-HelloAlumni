import { getDb, run, get, all, saveDb } from "../db.js";
import { haversineKm } from "../utils/distance.js";

export const createUserWithProfile = (user, profile) => {
  const now = new Date().toISOString();
  run(
    `INSERT INTO users (email, password_hash, name, graduation_year, alumni_identity_id, created_at)
     VALUES ($email, $password_hash, $name, $graduation_year, $alumni_identity_id, $created_at)`,
    {
      $email: user.email,
      $password_hash: user.password_hash,
      $name: user.name,
      $graduation_year: user.graduation_year || null,
      $alumni_identity_id: user.alumni_identity_id,
      $created_at: now
    }
  );
  const created = get(`SELECT * FROM users WHERE email = $email`, { $email: user.email });
  const userId = created.id;
  run(
    `INSERT INTO alumni_profiles (user_id, school, college, major, degree, city, district, address, address_en, country, lat, lng, office_address, office_lat, office_lng, privacy_level, job_title, company, industry, industry_segment, is_startup, business_domain, funding_stage, contact_name, contact_phone, contact_email, wechat, qq, skills, resources, updated_at)
     VALUES ($user_id, $school, $college, $major, $degree, $city, $district, $address, $address_en, $country, $lat, $lng, $office_address, $office_lat, $office_lng, $privacy_level, $job_title, $company, $industry, $industry_segment, $is_startup, $business_domain, $funding_stage, $contact_name, $contact_phone, $contact_email, $wechat, $qq, $skills, $resources, $updated_at)`,
    {
      $user_id: userId,
      $school: profile.school || null,
      $college: profile.college || null,
      $major: profile.major || null,
      $degree: profile.degree || null,
      $city: profile.city || null,
      $district: profile.district || null,
      $address: profile.address || null,
      $address_en: profile.address_en || null,
      $country: profile.country || null,
      $lat: profile.lat || null,
      $lng: profile.lng || null,
      $office_address: profile.office_address || null,
      $office_lat: profile.office_lat || null,
      $office_lng: profile.office_lng || null,
      $privacy_level: profile.privacy_level || "district",
      $job_title: profile.job_title || null,
      $company: profile.company || null,
      $industry: profile.industry || null,
      $industry_segment: profile.industry_segment || null,
      $is_startup: profile.is_startup ? 1 : 0,
      $business_domain: profile.business_domain || null,
      $funding_stage: profile.funding_stage || null,
      $contact_name: profile.contact_name || null,
      $contact_phone: profile.contact_phone || null,
      $contact_email: profile.contact_email || null,
      $wechat: profile.wechat || null,
      $qq: profile.qq || null,
      $skills: profile.skills ? JSON.stringify(profile.skills) : null,
      $resources: profile.resources ? JSON.stringify(profile.resources) : null,
      $updated_at: now
    }
  );
  saveDb();
  return getUserById(userId);
};

export const getUserByEmail = (email) => {
  return get(`SELECT * FROM users WHERE email = $email`, { $email: email });
};

export const getUserById = (id) => {
  const user = get(`SELECT * FROM users WHERE id = $id`, { $id: id });
  const profile = get(`SELECT * FROM alumni_profiles WHERE user_id = $id`, { $id: id });
  if (!user || !profile) return null;
  return { user, profile };
};

export const maskLocation = (profile) => {
  const level = profile.privacy_level || "district";
  if (level === "hidden" || level === "friends") {
    return { city: null, district: null, address: null, lat: null, lng: null };
  }
  if (level === "city") {
    return { city: profile.city, district: null, address: null, lat: null, lng: null };
  }
  if (level === "district") {
    return { city: profile.city, district: profile.district, address: null, lat: null, lng: null };
  }
  return { city: profile.city, district: profile.district, address: profile.address, lat: profile.lat, lng: profile.lng };
};

export const getAlumniList = (filters) => {
  const where = [];
  const params = {};
  if (filters.school) { where.push("school = $school"); params.$school = filters.school; }
  if (filters.college) { where.push("college = $college"); params.$college = filters.college; }
  if (filters.major) { where.push("major = $major"); params.$major = filters.major; }
  if (filters.graduation_year) { where.push("users.graduation_year = $graduation_year"); params.$graduation_year = filters.graduation_year; }
  if (filters.degree) { where.push("degree = $degree"); params.$degree = filters.degree; }
  if (filters.industry) { where.push("industry = $industry"); params.$industry = filters.industry; }
  if (filters.industry_segment) { where.push("industry_segment = $industry_segment"); params.$industry_segment = filters.industry_segment; }
  if (filters.is_startup != null) { where.push("is_startup = $is_startup"); params.$is_startup = filters.is_startup ? 1 : 0; }
  if (filters.funding_stage) { where.push("funding_stage = $funding_stage"); params.$funding_stage = filters.funding_stage; }
  if (filters.business_domain) { where.push("business_domain = $business_domain"); params.$business_domain = filters.business_domain; }
  if (filters.city) { where.push("city = $city"); params.$city = filters.city; }
  if (filters.district) { where.push("district = $district"); params.$district = filters.district; }
  if (filters.country) { where.push("country = $country"); params.$country = filters.country; }
  
  // Add fuzzy search support for keyword
  if (filters.keyword) {
    params.$keyword = `%${filters.keyword.toLowerCase()}%`;
    where.push(`(
      LOWER(users.name) LIKE $keyword OR 
      LOWER(industry) LIKE $keyword OR 
      LOWER(company) LIKE $keyword OR 
      LOWER(industry_segment) LIKE $keyword OR
      LOWER(job_title) LIKE $keyword OR
      LOWER(company) LIKE $keyword
    )`);
  }
  
  where.push("privacy_level NOT IN ('hidden','friends')");
  const sql = `SELECT users.id as user_id, users.name, users.graduation_year, users.alumni_identity_id, alumni_profiles.*
               FROM users JOIN alumni_profiles ON users.id = alumni_profiles.user_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const rows = all(sql, params);
  if (filters.lat != null && filters.lng != null && filters.radius_km != null) {
    const lat = Number(filters.lat), lng = Number(filters.lng), r = Number(filters.radius_km);
    const withDist = rows.map(rw => {
      const dist = rw.lat != null && rw.lng != null ? haversineKm(lat, lng, rw.lat, rw.lng) : null;
      return { ...rw, _distance_km: dist };
    }).filter(rw => rw._distance_km != null && rw._distance_km <= r)
      .sort((a, b) => (a._distance_km || 0) - (b._distance_km || 0));
    return withDist.map(rw => presentPublicRow(rw));
  }
  return rows.map(rw => presentPublicRow(rw));
};

export const presentPublicRow = (rw) => {
  const loc = maskLocation(rw);
  return {
    id: rw.user_id,
    name: rw.name,
    college: rw.college,
    major: rw.major,
    graduation_year: rw.graduation_year,
    industry: rw.industry,
    industry_segment: rw.industry_segment,
    company: rw.company,
    job_title: rw.job_title,
    funding_stage: rw.funding_stage,
    business_domain: rw.business_domain,
    is_startup: rw.is_startup === 1,
    contact_name: rw.contact_name,
    contact_phone: rw.contact_phone,
    contact_email: rw.contact_email,
    wechat: rw.wechat,
    qq: rw.qq,
    country: rw.country,
    city: loc.city,
    district: loc.district,
    address: loc.address,
    address_en: rw.address_en,
    lat: loc.lat,
    lng: loc.lng,
    office_address: rw.office_address,
    office_lat: rw.office_lat,
    office_lng: rw.office_lng,
    distance_km: rw._distance_km != null ? Number(rw._distance_km.toFixed(3)) : null
  };
};

export const getAlumniNearby = (lat, lng, radiusKm = 5) => {
  return getAlumniList({ lat, lng, radius_km: radiusKm });
};

export const getAlumniGroupedByIndustry = (filters) => {
  const base = getAlumniList(filters);
  const radiusKm = Number(filters.group_radius_km || 100);
  const buckets = {};
  for (const r of base) {
    const ind = r.industry || "未知";
    buckets[ind] = buckets[ind] || [];
    buckets[ind].push(r);
  }
  const groups = [];
  for (const [ind, arr] of Object.entries(buckets)) {
    const pts = arr.filter(x => x.lat != null && x.lng != null);
    const assigned = new Set();
    for (let i = 0; i < pts.length; i++) {
      if (assigned.has(i)) continue;
      const seed = pts[i];
      let cx = seed.lat, cy = seed.lng;
      const members = [i];
      assigned.add(i);
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < pts.length; j++) {
          if (assigned.has(j)) continue;
          const p = pts[j];
          const dist = haversineKm(cx, cy, p.lat, p.lng);
          if (dist != null && dist <= radiusKm) {
            members.push(j);
            assigned.add(j);
            const all = members.map(idx => pts[idx]);
            const avgLat = all.reduce((s, it) => s + (it.lat || 0), 0) / all.length;
            const avgLng = all.reduce((s, it) => s + (it.lng || 0), 0) / all.length;
            cx = avgLat; cy = avgLng;
            changed = true;
          }
        }
      }
      groups.push({
        industry: ind,
        lat: cx,
        lng: cy,
        virtual_count: members.length
      });
    }
  }
  return groups.map((g, index) => ({
    id: index + 1,
    name: `${g.industry}圈层`,
    college: null,
    major: null,
    graduation_year: null,
    industry: g.industry,
    industry_segment: null,
    company: null,
    job_title: null,
    funding_stage: null,
    business_domain: null,
    is_startup: false,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    country: null,
    city: null,
    district: null,
    address: null,
    address_en: null,
    lat: g.lat,
    lng: g.lng,
    distance_km: null,
    virtual_count: g.virtual_count
  }));
};

export const getAlumniDetail = (id) => {
  const res = getUserById(id);
  if (!res) return null;
  const loc = maskLocation(res.profile);
  return {
    id: res.user.id,
    name: res.user.name,
    alumni_identity_id: res.user.alumni_identity_id,
    graduation_year: res.user.graduation_year,
    school: res.profile.school,
    college: res.profile.college,
    major: res.profile.major,
    degree: res.profile.degree,
    company: res.profile.company,
    job_title: res.profile.job_title,
    industry: res.profile.industry,
    industry_segment: res.profile.industry_segment,
    is_startup: !!res.profile.is_startup,
    business_domain: res.profile.business_domain,
    funding_stage: res.profile.funding_stage,
    contact_name: res.profile.contact_name,
    contact_phone: res.profile.contact_phone,
    contact_email: res.profile.contact_email,
    wechat: res.profile.wechat,
    qq: res.profile.qq,
    country: res.profile.country,
    address_en: res.profile.address_en,
    skills: res.profile.skills ? JSON.parse(res.profile.skills) : [],
    resources: res.profile.resources ? JSON.parse(res.profile.resources) : [],
    city: loc.city,
    district: loc.district,
    address: loc.address,
    lat: loc.lat,
    lng: loc.lng,
    office_address: res.profile.office_address,
    office_lat: res.profile.office_lat,
    office_lng: res.profile.office_lng
  };
};

export const updatePrivacyLevel = (userId, level) => {
  const now = new Date().toISOString();
  run(`UPDATE alumni_profiles SET privacy_level = $level, updated_at = $updated WHERE user_id = $uid`, {
    $level: level, $updated: now, $uid: userId
  });
  saveDb();
  const res = get(`SELECT privacy_level FROM alumni_profiles WHERE user_id = $uid`, { $uid: userId });
  return Boolean(res);
};

export const updateUserAndProfile = (userId, data) => {
  const now = new Date().toISOString();
  const { user, profile } = data;

  if (user) {
    const sets = [];
    const params = { $uid: userId };
    if (user.name) { sets.push("name = $name"); params.$name = user.name; }
    if (user.graduation_year) { sets.push("graduation_year = $grad"); params.$grad = user.graduation_year; }
    
    if (sets.length > 0) {
      run(`UPDATE users SET ${sets.join(", ")} WHERE id = $uid`, params);
    }
  }

  if (profile) {
    const sets = [];
    const params = { $uid: userId, $updated: now };
    
    const fields = [
      "school", "college", "major", "degree", "city", "district", "address", 
      "address_en", "country", "lat", "lng", "office_address", "office_lat", "office_lng", "privacy_level", "job_title", 
      "company", "industry", "industry_segment", "business_domain", 
      "funding_stage", "contact_name", "contact_phone", "contact_email", "wechat", "qq"
    ];

    fields.forEach(f => {
      if (profile[f] !== undefined) {
        sets.push(`${f} = $${f}`);
        params[`$${f}`] = profile[f];
      }
    });

    if (profile.is_startup !== undefined) {
      sets.push("is_startup = $is_startup");
      params.$is_startup = profile.is_startup ? 1 : 0;
    }

    if (profile.skills !== undefined) {
      sets.push("skills = $skills");
      params.$skills = profile.skills ? JSON.stringify(profile.skills) : null;
    }

    if (profile.resources !== undefined) {
      sets.push("resources = $resources");
      params.$resources = profile.resources ? JSON.stringify(profile.resources) : null;
    }

    if (sets.length > 0) {
      sets.push("updated_at = $updated");
      run(`UPDATE alumni_profiles SET ${sets.join(", ")} WHERE user_id = $uid`, params);
    }
  }
  
  saveDb();
  return getUserById(userId);
};

export const searchAlumniByLocation = (locationQuery) => {
  // Fuzzy search implementation for location matching
  const searchTerms = locationQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  if (searchTerms.length === 0) {
    return [];
  }

  // Build fuzzy search conditions for different location fields
  const whereConditions = [];
  const params = {};
  
  searchTerms.forEach((term, index) => {
    const paramKey = `$term${index}`;
    params[paramKey] = `%${term}%`;
    
    // Search in multiple location fields with fuzzy matching
    whereConditions.push(`(
      LOWER(city) LIKE ${paramKey} OR 
      LOWER(district) LIKE ${paramKey} OR 
      LOWER(address) LIKE ${paramKey} OR 
      LOWER(country) LIKE ${paramKey}
    )`);
  });

  const whereClause = whereConditions.join(' AND ');
  
  const sql = `
    SELECT users.id as user_id, users.name, users.graduation_year, users.alumni_identity_id, alumni_profiles.*
    FROM users JOIN alumni_profiles ON users.id = alumni_profiles.user_id
    WHERE ${whereClause} AND privacy_level NOT IN ('hidden','friends')
    ORDER BY 
      CASE 
        WHEN LOWER(city) LIKE $term0 THEN 1
        WHEN LOWER(district) LIKE $term0 THEN 2
        WHEN LOWER(address) LIKE $term0 THEN 3
        ELSE 4
      END
  `;
  
  const rows = all(sql, params);
  return rows.map(rw => presentPublicRow(rw));
};
