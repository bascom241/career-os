// Dry-run by default. Apply only after resolving all collisions and taking a backup.
import "dotenv/config";
import mongoose from "mongoose";
const uri = process.env.NODE_ENV === "production" ? process.env.live_mongo_url : process.env.mongo_url;
if (!uri) throw new Error("Database URL is not configured");
await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
try {
 const users = mongoose.connection.collection("users");
 const records = await users.find({}, { projection: { email: 1, isEmailVerified: 1, isVerified: 1, emailVerified: 1, verified: 1 } }).toArray();
 const seen = new Map<string, string[]>();
 let invalid = 0;
 for (const row of records) { if (typeof row.email !== "string" || !row.email.trim()) { invalid++; continue; } const key = row.email.trim().toLowerCase(); const ids = seen.get(key) ?? []; ids.push(String(row._id)); seen.set(key, ids); }
 const collisions = [...seen.values()].filter(ids => ids.length > 1);
 console.log(JSON.stringify({ scanned: records.length, invalidEmails: invalid, collisionGroups: collisions, matchingF98: records.filter(row => String(row._id).endsWith("f98")).map(({ _id, isEmailVerified, isVerified, emailVerified, verified }) => ({ id: String(_id), isEmailVerified, isVerified, emailVerified, verified })) }, null, 2));
 if (process.argv.includes("--apply")) {
  if (invalid || collisions.length) throw new Error("Resolve invalid emails and collisions before applying migration");
  for (const row of records) { const normalized = (row.email as string).trim().toLowerCase(); if (row.email !== normalized) await users.updateOne({ _id: row._id }, { $set: { email: normalized } }); }
  await users.createIndex({ email: 1 }, { unique: true, name: "email_1" });
  console.log("Email normalization and unique index complete");
 } else console.log("Dry run only; no data changed. Use --apply after reviewing collisions and backups.");
} finally { await mongoose.disconnect(); }
