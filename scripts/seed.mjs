import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI missing in .env.local");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    username: { type: String, unique: true, sparse: true },
    password: String,
    role: String,
    district: String,
    alcCenterCode: String,
    alcCenterName: String,
    status: { type: String, default: "approved" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const DCU_ACCOUNTS = [
  { fullName: "DCU Nagpur", username: "nagpur_dcu", password: "dcunagpur@12345wxyz$%^", district: "Nagpur", email: "dcu.nagpur@impactone.com" },
  { fullName: "DCU Gondiya", username: "gondia_dcu", password: "dcugondia@888pqrs@#", district: "Gondiya", email: "dcu.gondia@impactone.com" },
  { fullName: "DCU Wardha", username: "wardha_dcu", password: "dcuwardha@987@#$klmn", district: "Wardha", email: "dcu.wardha@impactone.com" },
  { fullName: "DCU Gadchiroli", username: "gadchiroli_dcu", password: "dcugadchiroli@4456&*def", district: "Gadchiroli", email: "dcu.gadchiroli@impactone.com" },
  { fullName: "DCU Bhandara", username: "bhandara_dcu", password: "dcubhandara@925^&*ijk", district: "Bhandara", email: "dcu.bhandara@impactone.com" },
  { fullName: "DCU Chandrapur", username: "chandrapur_dcu", password: "dcuchandrapur@5673opq#@", district: "Chandrapur", email: "dcu.chandrapur@impactone.com" },
].map((a) => ({ ...a, role: "DCU", status: "approved" }));

const MRCU_ACCOUNT = {
  fullName: "MRCU Admin",
  username: "mrcu_admin",
  password: "spipl@7730pqrst&*(xyz)@$67",
  email: "mrcu@impactone.com",
  role: "MRCU",
  status: "approved",
};

const SUPERADMIN_ACCOUNT = {
  fullName: "Super Admin",
  username: "spipl-tech",
  password: "spipl@1998dcbaefgh@$67%^&",
  email: "superadmin@impactone.com",
  role: "SuperAdmin",
  status: "approved",
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const all = [...DCU_ACCOUNTS, MRCU_ACCOUNT, SUPERADMIN_ACCOUNT];

  for (const acc of all) {
    const hashed = await bcrypt.hash(acc.password, 10);
    const existing = await User.findOne({ username: acc.username });
    if (existing) {
      existing.password = hashed;
      existing.role = acc.role;
      existing.district = acc.district;
      existing.status = "approved";
      await existing.save();
      console.log(`Updated: ${acc.username}`);
    } else {
      await User.create({ ...acc, password: hashed });
      console.log(`Created: ${acc.username}`);
    }
  }

  console.log("\n--- Seeded Login Credentials ---");
  DCU_ACCOUNTS.forEach((a) =>
    console.log(`DCU  | district: ${a.district.padEnd(12)} | username: ${a.username.padEnd(16)} | password: ${a.password}`)
  );
  console.log(`MRCU | username: ${MRCU_ACCOUNT.username} | password: ${MRCU_ACCOUNT.password}`);
  console.log(`ADMIN| username: ${SUPERADMIN_ACCOUNT.username} | password: ${SUPERADMIN_ACCOUNT.password}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
