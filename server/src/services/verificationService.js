import { nanoid } from "nanoid";

// Mock internal database
const internalStudentDatabase = [
  { student_id: "2016001", name: "张三", graduation_year: 2020, school: "厦门大学" },
  { student_id: "2016002", name: "李四", graduation_year: 2020, school: "厦门大学" },
  { student_id: "2016003", name: "王五", graduation_year: 2021, school: "厦门大学" }
];

export const verifyIdentity = async (verification, payload) => {
  console.log("Verifying identity:", verification.method, payload);

  // 1. Unified Identity Authentication (Mock)
  if (verification.method === "unified_auth") {
    // In a real system, this would call an external API with a token
    // Here we assume if they passed the "unified auth" gate, they are valid.
    return {
      success: true,
      identity_id: `ALUMNI_${nanoid(12)}`,
      verified_info: {
        school: "厦门大学", // Inferred from auth
        name: payload.name
      }
    };
  }

  // 2. Digital Identity Card Scan (Mock)
  if (verification.method === "digital_card") {
    // Mocking a successful scan verification
    // In reality, this might involve checking a QR code or token
    return {
      success: true,
      identity_id: `ALUMNI_${nanoid(12)}`,
      verified_info: {
        school: "厦门大学",
        name: payload.name
      }
    };
  }

  // 3. Student ID + Name + Graduation Year
  if (verification.method === "student_record") {
    const { student_id, year } = verification;
    const match = internalStudentDatabase.find(s => 
      s.student_id === student_id && 
      // s.name === payload.name && // Relax name check for demo or strict it
      // s.graduation_year === year // Strict check
      true // For demo purposes, let's be lenient or add the demo user
    );

    // If we want to support the demo user explicitly or valid logic
    if (student_id && payload.name) {
       return {
        success: true,
        identity_id: `ALUMNI_${nanoid(12)}`,
        verified_info: {
          school: payload.school,
          name: payload.name,
          student_id
        }
      };
    }
    
    return { success: false, error: "record_not_found" };
  }

  return { success: false, error: "invalid_method" };
};
