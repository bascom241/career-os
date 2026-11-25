import test from "node:test";
import assert from "node:assert/strict";
import { validateCandidateAsset } from "../service/asset-validation.service.ts";
import { buildCandidateOnboarding } from "../service/onboarding.service.ts";
import { candidateProfileSchema } from "../schemas/candidate.schema.ts";

const file = (buffer: Buffer) => ({ buffer }) as Express.Multer.File;

test("asset validation accepts only the supported signatures for each kind", () => {
    const pdf = file(Buffer.from("%PDF-example"));
    const png = file(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const jpeg = file(Buffer.from([0xff, 0xd8, 0xff]));
    assert.equal(validateCandidateAsset("resume", pdf).contentType, "application/pdf");
    assert.equal(validateCandidateAsset("photo", png).contentType, "image/png");
    assert.equal(validateCandidateAsset("photo", jpeg).contentType, "image/jpeg");
    assert.throws(() => validateCandidateAsset("photo", pdf));
    assert.throws(() => validateCandidateAsset("resume", png));
    assert.throws(() => validateCandidateAsset("resume"));
});

test("onboarding marks remote work as a location and three skills as complete", () => {
    const result = buildCandidateOnboarding({
        firstName: "Ada", function: "Design", specializations: ["Product"],
        skills: ["Design", "Research", "Prototyping"], industries: ["Health"],
        locations: [], remotePreference: "yes", currentStep: "visibility"
    });
    assert.deepEqual(result.missingRequirements, []);
    assert.equal(result.membershipRequirementsStatus, "undecided");
    assert.deepEqual(buildCandidateOnboarding({ firstName: "", function: "", specializations: [], skills: [], industries: [], locations: [], remotePreference: "no", currentStep: "account" }).missingRequirements, ["firstName", "function", "specializations", "skills", "industries", "locations"]);
});

test("profile validation accepts partial drafts and rejects duplicate selections", () => {
    assert.equal(candidateProfileSchema.safeParse({ body: { version: 0, firstName: " Ada " } }).success, true);
    assert.equal(candidateProfileSchema.safeParse({ body: { version: 0, skills: ["Design", "design"] } }).success, false);
    assert.equal(candidateProfileSchema.safeParse({ body: { version: 0 } }).success, false);
});
