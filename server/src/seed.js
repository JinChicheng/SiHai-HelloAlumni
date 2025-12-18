import bcrypt from "bcryptjs";
import { all, get, run, saveDb } from "./db.js";
import { createUserWithProfile } from "./models/alumni.js";
import { nanoid } from "nanoid";

const cities = [
  { city: "北京", district: "朝阳区", center: [116.443, 39.921] },
  { city: "北京", district: "海淀区", center: [116.299, 39.978] },
  { city: "北京", district: "西城区", center: [116.365, 39.904] },
  { city: "北京", district: "大兴区", center: [116.341, 39.726] },
  { city: "北京", district: "通州区", center: [116.656, 39.909] },
  { city: "上海", district: "浦东新区", center: [121.544, 31.221] },
  { city: "上海", district: "静安区", center: [121.453, 31.235] },
  { city: "上海", district: "徐汇区", center: [121.436, 31.188] },
  { city: "上海", district: "闵行区", center: [121.381, 31.112] },
  { city: "深圳", district: "南山区", center: [113.929, 22.533] },
  { city: "深圳", district: "福田区", center: [114.064, 22.541] },
  { city: "深圳", district: "宝安区", center: [113.883, 22.553] },
  { city: "深圳", district: "龙岗区", center: [114.247, 22.719] },
  { city: "杭州", district: "西湖区", center: [120.131, 30.266] },
  { city: "杭州", district: "滨江区", center: [120.210, 30.209] },
  { city: "杭州", district: "余杭区", center: [120.298, 30.418] },
  { city: "成都", district: "高新区", center: [104.067, 30.570] },
  { city: "成都", district: "武侯区", center: [104.043, 30.642] },
  { city: "成都", district: "锦江区", center: [104.083, 30.655] },
  { city: "武汉", district: "武昌区", center: [114.316, 30.541] },
  { city: "武汉", district: "洪山区", center: [114.342, 30.499] },
  { city: "武汉", district: "江汉区", center: [114.270, 30.600] },
  { city: "西安", district: "雁塔区", center: [108.949, 34.222] },
  { city: "西安", district: "碑林区", center: [108.937, 34.256] },
  { city: "南京", district: "鼓楼区", center: [118.769, 32.066] },
  { city: "南京", district: "建邺区", center: [118.732, 32.004] },
  { city: "南京", district: "江宁区", center: [118.839, 31.952] },
  { city: "苏州", district: "工业园区", center: [120.672, 31.314] },
  { city: "苏州", district: "虎丘区", center: [120.573, 31.295] },
  { city: "广州", district: "天河区", center: [113.361, 23.124] },
  { city: "广州", district: "海珠区", center: [113.317, 23.089] },
  { city: "广州", district: "越秀区", center: [113.266, 23.132] },
  { city: "合肥", district: "蜀山区", center: [117.262, 31.851] },
  { city: "合肥", district: "包河区", center: [117.294, 31.815] }
];

const colleges = ["管理学院", "计算机系", "金融学院", "经管学院", "材料学院", "物理学院", "化学学院", "生命科学学院", "工程科学学院", "少年班学院"];
const majors = ["计算机", "金融", "市场", "软件工程", "数据科学", "电子信息", "自动化", "物理学", "化学", "生物科学", "人工智能", "微电子"];
const degrees = ["本科", "硕士", "博士"];
const industries = ["互联网", "金融", "制造", "教育", "咨询", "医疗健康", "新能源", "人工智能", "半导体", "企业服务"];
const industrySegments = {
  "金融": ["投行", "券商", "基金", "银行", "保险", "信托"],
  "互联网": ["研发", "产品", "运营", "创业", "设计", "测试"],
  "制造": ["研发", "工艺", "供应链", "质量管理"],
  "教育": ["教研", "培训", "行政", "K12"],
  "咨询": ["管理咨询", "战略咨询", "IT咨询"],
  "医疗健康": ["医生", "医药研发", "医疗器械", "生物技术"],
  "新能源": ["电池研发", "光伏", "风电", "储能"],
  "人工智能": ["算法", "数据挖掘", "NLP", "CV", "大模型"],
  "半导体": ["IC设计", "封装测试", "设备制造"],
  "企业服务": ["SaaS", "云服务", "网络安全"]
};
const companies = ["字节跳动", "阿里巴巴", "腾讯", "华为", "蚂蚁集团", "招商银行", "平安集团", "美团", "京东", "拼多多", "网易", "百度", "小米", "滴滴", "快手", "大疆", "科大讯飞", "蔚来汽车", "宁德时代"];
const jobTitles = ["产品经理", "后端工程师", "前端工程师", "数据分析师", "算法工程师", "投资经理", "市场主管", "运营经理", "创始人", "CEO", "CTO", "COO", "架构师", "研究员"];
const fundingStages = ["天使轮", "种子轮", "A轮", "B轮", "C轮", "D轮", "IPO", "不需要融资", "Pre-A轮", "A+轮"];
const businessDomains = ["AI", "SaaS", "教育科技", "金融科技", "电商", "企业服务", "医疗健康", "智能硬件", "社交娱乐", "自动驾驶", "机器人"];
const overseasCountries = ["United States", "United Kingdom", "Germany", "Japan", "Singapore", "Canada", "Australia", "France", "Netherlands", "Switzerland"];
const overseasCities = {
  "United States": ["San Francisco", "New York", "Boston", "Seattle", "Los Angeles", "Chicago", "Austin"],
  "United Kingdom": ["London", "Manchester", "Cambridge", "Oxford"],
  "Germany": ["Berlin", "Munich", "Frankfurt"],
  "Japan": ["Tokyo", "Osaka", "Kyoto"],
  "Singapore": ["Singapore"],
  "Canada": ["Toronto", "Vancouver", "Montreal"],
  "Australia": ["Sydney", "Melbourne", "Brisbane"],
  "France": ["Paris", "Lyon"],
  "Netherlands": ["Amsterdam"],
  "Switzerland": ["Zurich"]
};

function jitter([lng, lat]) {
  // Increase jitter range significantly to spread points out (~20km range)
  const dlng = (Math.random() - 0.5) * 0.35;
  const dlat = (Math.random() - 0.5) * 0.25;
  return [Number((lng + dlng).toFixed(6)), Number((lat + dlat).toFixed(6))];
}

export async function seedIfEmpty() {
  // Clear existing data to force re-seed with better distribution
  const count = all("SELECT COUNT(1) AS c FROM alumni_profiles")[0]?.c || 0;
  
  // If we already have a lot of data, we might assume it's the new data, 
  // but user asked for modification, so let's check if we have enough startups.
  // Actually, to ensure distribution, best to truncate if it's the old small dataset.
  // Or just always truncate for this dev task to ensure user sees changes.
  // Let's check if we have less than 500 records.
  
  if (count > 0 && count < 500) {
    run("DELETE FROM alumni_profiles");
    run("DELETE FROM users");
    console.log("Cleared old data for re-seeding...");
  }
  
  const currentCount = all("SELECT COUNT(1) AS c FROM alumni_profiles")[0]?.c || 0;
  if (currentCount >= 500) {
    await ensureDefaultUser();
    // Seed Events, Resources and Projects even if alumni exist
    await seedEvents();
    await seedResources();
    await seedProjects();
    return;
  }

  const target = 800;
  const need = Math.max(0, target - currentCount);
  const passwordHash = await bcrypt.hash("demo12345", 10);
  const nowYear = new Date().getFullYear();

  console.log(`Seeding ${need} alumni profiles...`);

  const overseasCoords = {
    "San Francisco": [-122.419, 37.774], "New York": [-74.006, 40.712], "Boston": [-71.058, 42.360], "Seattle": [-122.332, 47.606],
    "Los Angeles": [-118.243, 34.052], "Chicago": [-87.629, 41.878], "Austin": [-97.743, 30.267],
    "London": [-0.127, 51.507], "Manchester": [-2.242, 53.480], "Cambridge": [0.121, 52.205], "Oxford": [-1.257, 51.752],
    "Berlin": [13.405, 52.520], "Munich": [11.582, 48.135], "Frankfurt": [8.682, 50.110],
    "Tokyo": [139.691, 35.689], "Osaka": [135.502, 34.693], "Kyoto": [135.768, 34.999],
    "Singapore": [103.819, 1.352],
    "Toronto": [-79.383, 43.653], "Vancouver": [-123.120, 49.282], "Montreal": [-73.567, 45.501],
    "Sydney": [151.209, -33.868], "Melbourne": [144.963, -37.813], "Brisbane": [153.025, -27.469],
    "Paris": [2.352, 48.856], "Lyon": [4.835, 45.764],
    "Amsterdam": [4.904, 52.367],
    "Zurich": [8.541, 47.376]
  };

  for (let i = 0; i < need; i++) {
    const idx = currentCount + i;
    const cityMeta = cities[idx % cities.length];
    const [lng, lat] = jitter(cityMeta.center);
    const name = `演示校友${String(idx + 1).padStart(4, "0")}`;
    const email = `demo${idx + 1}@example.com`;
    const college = colleges[idx % colleges.length];
    const major = majors[idx % majors.length];
    const degree = degrees[idx % degrees.length];
    const industry = industries[idx % industries.length];
    const segs = industrySegments[industry] || ["其他"];
    const industry_segment = segs[idx % segs.length];
    const company = companies[idx % companies.length];
    const job_title = jobTitles[idx % jobTitles.length];
    const graduation_year = nowYear - (3 + (idx % 25));
    const alumni_identity_id = `ALUMNI_${nanoid(10)}`;

    // Increase startup ratio to 40% for more startup data
    const is_startup = idx % 5 < 2; // 2 out of 5 are startups (40%)
    const is_overseas = idx % 10 === 0; // 10% overseas
    
    let country = null, address_en = null;
    let biz = null, funding = null, contact_name = null, contact_phone = null, contact_email = null;
    let city = cityMeta.city;
    let district = cityMeta.district;
    let address = `${cityMeta.city}${cityMeta.district}示例路${100 + i}号`;
    let lngVar = lng, latVar = lat;
    
    if (is_overseas) {
      country = overseasCountries[idx % overseasCountries.length];
      const ocities = overseasCities[country] || ["Unknown"];
      city = ocities[idx % ocities.length];
      district = null;
      address = `${city}, ${country}`;
      address_en = address;
      
      const coords = overseasCoords[city];
      if (coords) {
         const [baseLng, baseLat] = coords;
         // Jitter slightly for overseas to avoid stacking
         const dlng = (Math.random() - 0.5) * 0.1;
         const dlat = (Math.random() - 0.5) * 0.1;
         lngVar = Number((baseLng + dlng).toFixed(6));
         latVar = Number((baseLat + dlat).toFixed(6));
      } else {
         lngVar = null;
         latVar = null;
      }
    }
    
    if (is_startup) {
      biz = businessDomains[idx % businessDomains.length];
      funding = fundingStages[idx % fundingStages.length];
      contact_name = `联系人${idx}`;
      contact_phone = `138${String(10000000 + idx).slice(-8)}`;
      contact_email = `contact${idx}@startup.example.com`;
    }

    createUserWithProfile(
      {
        email,
        password_hash: passwordHash,
        name,
        graduation_year,
        alumni_identity_id
      },
      {
        school: "示例大学",
        college,
        major,
        degree,
        city,
        district,
        address,
        address_en,
        country,
        lat: latVar,
        lng: lngVar,
        industry,
        industry_segment,
        company: is_startup ? `创业公司${idx}` : company,
        job_title: is_startup ? "创始人" : job_title,
        is_startup,
        business_domain: biz,
        funding_stage: funding,
        contact_name,
        contact_phone,
        contact_email,
        skills: ["沟通", "协作", "编程", "管理"],
        resources: ["内推", "行业交流", "资金对接"],
        privacy_level: "address"
      }
    );
  }
  saveDb();
  await ensureDefaultUser();
  await seedEvents();
  await seedResources();
  await seedProjects();
}

export async function seedEvents() {
  const eventCount = all("SELECT COUNT(1) AS c FROM events")[0]?.c || 0;
  if (eventCount === 0) {
    console.log("Seeding events...");
    const sampleEvents = [
      {
        title: "2024年北京校友春季沙龙",
        description: "邀请各行业校友共聚一堂，探讨行业发展新趋势。",
        start_time: "2024-04-20T14:00:00",
        end_time: "2024-04-20T17:00:00",
        location_name: "北京大学中关村创业大街",
        address: "北京市海淀区中关村创业大街",
        lat: 39.982,
        lng: 116.305
      },
      {
        title: "上海校友金融行业交流会",
        description: "聚焦金融科技与量化投资，欢迎金融行业校友参加。",
        start_time: "2024-05-15T19:00:00",
        end_time: "2024-05-15T21:00:00",
        location_name: "上海中心大厦",
        address: "上海市浦东新区陆家嘴银城中路501号",
        lat: 31.233,
        lng: 121.505
      },
      {
        title: "深圳校友户外徒步活动",
        description: "周末梧桐山徒步，强身健体，联络感情。",
        start_time: "2024-06-01T08:00:00",
        end_time: "2024-06-01T14:00:00",
        location_name: "梧桐山风景区",
        address: "深圳市罗湖区梧桐山村",
        lat: 22.585,
        lng: 114.202
      }
    ];

    const now = new Date().toISOString();
    sampleEvents.forEach(evt => {
      run(
        `INSERT INTO events (title, description, start_time, end_time, location_name, address, lat, lng, created_at)
         VALUES ($title, $description, $start_time, $end_time, $location_name, $address, $lat, $lng, $created_at)`,
        {
          $title: evt.title,
          $description: evt.description,
          $start_time: evt.start_time,
          $end_time: evt.end_time,
          $location_name: evt.location_name,
          $address: evt.address,
          $lat: evt.lat,
          $lng: evt.lng,
          $created_at: now
        }
      );
    });
    saveDb();
  }
}

export async function seedResources() {
  const resourceCount = all("SELECT COUNT(1) AS c FROM resources")[0]?.c || 0;
  if (resourceCount === 0) {
    console.log("Seeding resources...");
    const resourceTypes = ["recruitment", "cooperation", "investment", "service"];
    const resourceTitles = {
      "recruitment": ["招聘后端开发工程师", "寻找前端技术人才", "招聘产品经理", "需要UI/UX设计师", "招聘算法工程师"],
      "cooperation": ["寻求供应链合作伙伴", "寻找渠道代理", "技术合作开发", "市场推广合作", "产品分销合作"],
      "investment": ["寻求天使轮投资", "A轮融资需求", "寻找战略投资者", "项目众筹", "产业基金合作"],
      "service": ["提供办公场地租赁", "法律财税咨询", "人力资源服务", "品牌设计服务", "IT运维支持"]
    };
    
    const now = new Date().toISOString();
    const users = all("SELECT id, name FROM users LIMIT 5");
    
    for (let i = 0; i < 20; i++) {
      const user = users[i % users.length];
      const type = resourceTypes[i % resourceTypes.length];
      const titles = resourceTitles[type];
      const title = titles[i % titles.length];
      const cityMeta = cities[i % cities.length];
      const [lng, lat] = jitter(cityMeta.center);
      
      run(
        `INSERT INTO resources (user_id, type, title, description, address, lat, lng, contact_name, contact_phone, created_at)
         VALUES ($user_id, $type, $title, $description, $address, $lat, $lng, $contact_name, $contact_phone, $created_at)`,
        {
          $user_id: user.id,
          $type: type,
          $title: title,
          $description: `${title}，欢迎有兴趣的校友联系。`,
          $address: `${cityMeta.city}${cityMeta.district}示例路${100 + i}号`,
          $lat: lat,
          $lng: lng,
          $contact_name: user.name,
          $contact_phone: `138${String(10000000 + i).slice(-8)}`,
          $created_at: now
        }
      );
    }
    saveDb();
  }
}

export async function seedProjects() {
  const projectCount = all("SELECT COUNT(1) AS c FROM projects")[0]?.c || 0;
  if (projectCount === 0) {
    console.log("Seeding projects...");
    const fundingStages = ["seed", "angel", "series-a", "series-b", "series-c", "pre-ipo"];
    const projectNames = [
      "AI智能教育平台", "企业SaaS服务系统", "新能源汽车零部件", "医疗健康大数据", 
      "跨境电商平台", "人工智能芯片", "智慧农业解决方案", "工业物联网", 
      "元宇宙社交应用", "生物科技研发"
    ];
    
    const now = new Date().toISOString();
    const users = all("SELECT id, name FROM users LIMIT 5");
    
    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length];
      const name = projectNames[i % projectNames.length];
      const fundingStage = fundingStages[i % fundingStages.length];
      const cityMeta = cities[i % cities.length];
      const [lng, lat] = jitter(cityMeta.center);
      
      run(
        `INSERT INTO projects (user_id, name, description, funding_target, funding_stage, address, lat, lng, alumni_id_verification, project_materials, status, created_at, updated_at)
         VALUES ($user_id, $name, $description, $funding_target, $funding_stage, $address, $lat, $lng, $alumni_id, $project_materials, $status, $created_at, $updated_at)`,
        {
          $user_id: user.id,
          $name: name,
          $description: `${name}是一个创新的创业项目，致力于解决行业痛点，市场前景广阔。`,
          $funding_target: 1000000 + (i * 500000),
          $funding_stage: fundingStage,
          $address: `${cityMeta.city}${cityMeta.district}创业园${i + 1}号楼`,
          $lat: lat,
          $lng: lng,
          $alumni_id: `ALUMNI_${nanoid(10)}`,
          $project_materials: `https://example.com/project/${i}`,
          $status: "approved",
          $created_at: now,
          $updated_at: now
        }
      );
    }
    saveDb();
  }
}

export async function ensureDefaultUser() {
  const email = "user";
  const targetPassword = "123456";
  const exists = get("SELECT id FROM users WHERE email = $email", { $email: email });
  
  if (exists) {
    console.log(`Updating default user 'user' with password '${targetPassword}'...`);
    const passwordHash = await bcrypt.hash(targetPassword, 10);
    run("UPDATE users SET password_hash = $ph WHERE id = $id", { $ph: passwordHash, $id: exists.id });
    saveDb();
    return;
  }

  console.log(`Creating default user 'user' with password '${targetPassword}'...`);
  const passwordHash = await bcrypt.hash(targetPassword, 10);
  const alumni_identity_id = `ALUMNI_${nanoid(10)}`;
  
  createUserWithProfile(
    {
      email,
      password_hash: passwordHash,
      name: "默认校友",
      graduation_year: 2020,
      alumni_identity_id
    },
    {
      school: "厦门大学",
      college: "计算机系",
      major: "计算机科学与技术",
      degree: "本科",
      city: "厦门",
      district: "思明区",
      address: "厦门大学思明校区",
      lat: 24.435,
      lng: 118.096,
      industry: "互联网",
      company: "厦门大学",
      job_title: "校友",
      privacy_level: "district"
    }
  );
  saveDb();
}

// Run seed function when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedIfEmpty().then(() => {
    console.log("Seeding completed!");
    process.exit(0);
  }).catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
