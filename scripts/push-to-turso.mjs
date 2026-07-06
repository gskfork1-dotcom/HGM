import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'PATIENT',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AppConfiguration (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  logoUrl TEXT NOT NULL DEFAULT '/assets/logo-default.svg',
  landingHeroTitle TEXT NOT NULL DEFAULT 'Hidup Ginjal Muda: Jalani Terapi dengan Jiwa Muda',
  landingHeroSub TEXT NOT NULL DEFAULT 'Platform premium pendamping Hemodialisis & CAPD',
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedByUserId TEXT NOT NULL,
  FOREIGN KEY (updatedByUserId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS AcademyArticle (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  htmlBody TEXT NOT NULL,
  isPublished INTEGER NOT NULL DEFAULT 0,
  authorId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (authorId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS DailyLog (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  entryDate DATETIME NOT NULL,
  systolicBP INTEGER,
  diastolicBP INTEGER,
  weight REAL,
  fluidIntake INTEGER,
  urineOutput INTEGER,
  temperature REAL,
  bloodSugar INTEGER,
  symptoms TEXT,
  mood INTEGER,
  sleepDuration REAL,
  therapyAdherence INTEGER,
  notes TEXT,
  recordedById TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (recordedById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_dailylog_patient_date ON DailyLog(patientId, entryDate);

CREATE TABLE IF NOT EXISTS TherapySchedule (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  therapyType TEXT NOT NULL,
  title TEXT,
  location TEXT,
  notes TEXT,
  isRecurring INTEGER NOT NULL DEFAULT 0,
  recurringRule TEXT,
  startTime DATETIME NOT NULL,
  endTime DATETIME,
  durationMinutes INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_therapyschedule_patient_start ON TherapySchedule(patientId, startTime);

CREATE TABLE IF NOT EXISTS TherapySession (
  id TEXT PRIMARY KEY,
  scheduleId TEXT NOT NULL,
  patientId TEXT NOT NULL,
  actualStartTime DATETIME,
  actualEndTime DATETIME,
  completed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  skipReason TEXT,
  preWeight REAL,
  postWeight REAL,
  preBP TEXT,
  postBP TEXT,
  symptoms TEXT,
  attendantName TEXT,
  location TEXT,
  notes TEXT,
  confirmedById TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scheduleId) REFERENCES TherapySchedule(id),
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (confirmedById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_therapysession_patient ON TherapySession(patientId, scheduleId);

CREATE TABLE IF NOT EXISTS Medication (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times TEXT NOT NULL,
  withFood INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  currentStock INTEGER,
  stockAlertAt INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_medication_patient ON Medication(patientId);

CREATE TABLE IF NOT EXISTS MedicationLog (
  id TEXT PRIMARY KEY,
  medicationId TEXT NOT NULL,
  patientId TEXT NOT NULL,
  takenAt DATETIME NOT NULL,
  taken INTEGER NOT NULL DEFAULT 1,
  skippedReason TEXT,
  notes TEXT,
  recordedById TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicationId) REFERENCES Medication(id),
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (recordedById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_medicationlog_med ON MedicationLog(medicationId, takenAt);

CREATE TABLE IF NOT EXISTS LabResult (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  testDate DATETIME NOT NULL,
  labName TEXT,
  notes TEXT,
  recordedById TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (recordedById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_labresult_patient_date ON LabResult(patientId, testDate);

CREATE TABLE IF NOT EXISTS LabParameter (
  id TEXT PRIMARY KEY,
  labResultId TEXT NOT NULL,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  normalMin REAL,
  normalMax REAL,
  isCritical INTEGER,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (labResultId) REFERENCES LabResult(id)
);

CREATE INDEX IF NOT EXISTS idx_labparameter_result ON LabParameter(labResultId);

CREATE TABLE IF NOT EXISTS FoodItem (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  servingSize TEXT,
  calories INTEGER,
  protein REAL,
  sodium INTEGER,
  potassium INTEGER,
  phosphorus INTEGER,
  fluid INTEGER,
  isSafeForKidney TEXT,
  imageUrl TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FoodDiary (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  entryDate DATETIME NOT NULL,
  mealTime TEXT NOT NULL,
  foodItemId TEXT NOT NULL,
  portion REAL NOT NULL,
  notes TEXT,
  recordedById TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES User(id),
  FOREIGN KEY (foodItemId) REFERENCES FoodItem(id),
  FOREIGN KEY (recordedById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_fooddiary_patient_date ON FoodDiary(patientId, entryDate);

CREATE TABLE IF NOT EXISTS ForumCategory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ForumThread (
  id TEXT PRIMARY KEY,
  categoryId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  isAnonymous INTEGER NOT NULL DEFAULT 0,
  isPinned INTEGER NOT NULL DEFAULT 0,
  isLocked INTEGER NOT NULL DEFAULT 0,
  viewCount INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES ForumCategory(id)
);

CREATE TABLE IF NOT EXISTS ForumReply (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  isAnonymous INTEGER NOT NULL DEFAULT 0,
  isBestAnswer INTEGER NOT NULL DEFAULT 0,
  upvoteCount INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (threadId) REFERENCES ForumThread(id)
);

CREATE INDEX IF NOT EXISTS idx_forumreply_thread ON ForumReply(threadId);

CREATE TABLE IF NOT EXISTS AcademyVideo (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnailUrl TEXT,
  duration INTEGER,
  category TEXT NOT NULL,
  isPublished INTEGER NOT NULL DEFAULT 0,
  authorId TEXT NOT NULL,
  seriesId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS VideoSeries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS MythFact (
  id TEXT PRIMARY KEY,
  statement TEXT NOT NULL,
  isMyth INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  source TEXT,
  imageUrl TEXT,
  category TEXT,
  isPublished INTEGER NOT NULL DEFAULT 0,
  authorId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DialysisClinic (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  phone TEXT,
  latitude REAL,
  longitude REAL,
  hasHD INTEGER NOT NULL DEFAULT 0,
  hasCAPD INTEGER NOT NULL DEFAULT 0,
  acceptsBPJS INTEGER NOT NULL DEFAULT 1,
  is24Hours INTEGER NOT NULL DEFAULT 0,
  facilities TEXT,
  rating REAL,
  imageUrl TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinic_city ON DialysisClinic(city);

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data TEXT,
  isRead INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'push',
  sentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  readAt DATETIME,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_user_read ON Notification(userId, isRead);
CREATE INDEX IF NOT EXISTS idx_notification_user_sent ON Notification(userId, sentAt);

CREATE TABLE IF NOT EXISTS TransplantTracker (
  id TEXT PRIMARY KEY,
  patientId TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  transplantDate DATETIME,
  hospital TEXT,
  donorType TEXT,
  bloodTypeMatch TEXT,
  crossMatchResult TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EmergencyContact (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  phone TEXT NOT NULL,
  isPrimary INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS PatientMedicalInfo (
  id TEXT PRIMARY KEY,
  patientId TEXT UNIQUE NOT NULL,
  bloodType TEXT,
  rhesus TEXT,
  diagnosis TEXT,
  allergies TEXT,
  comorbidities TEXT,
  medicationsSummary TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

async function main() {
  try {
    client.execute("PRAGMA foreign_keys = OFF");
    for (const statement of sql.split(";").filter((s) => s.trim())) {
      await client.execute(statement.trim() + ";");
    }
    client.execute("PRAGMA foreign_keys = ON");
    console.log("Schema pushed to Turso successfully!");
  } catch (error) {
    console.error("Error pushing schema:", error);
  } finally {
    client.close();
  }
}

main();
