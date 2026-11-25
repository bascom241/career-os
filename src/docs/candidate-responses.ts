const id = { type: "string", example: "507f1f77bcf86cd799439011" };
const date = { type: "string", format: "date-time" };
const strings = { type: "array", items: { type: "string" } };
const envelope = (data: object) => ({ type: "object", properties: { success: { const: true }, data }, required: ["success", "data"] });

export const profile = {
    type: "object",
    properties: {
        _id: id, userId: id, firstName: { type: "string", example: "Ada" }, headline: { type: "string" }, about: { type: "string" },
        photoAssetId: { anyOf: [id, { type: "null" }] }, resumeAssetId: { anyOf: [id, { type: "null" }] },
        function: { type: "string" }, specializations: strings, skills: strings, industries: strings, locations: strings,
        remotePreference: { type: "string", enum: ["yes", "no", "undecided"] }, visibility: { type: "string", enum: ["anonymous", "open"] },
        hiddenEmployers: strings, hiddenFromAll: { type: "boolean" }, currentStep: { type: "string" }, version: { type: "integer", minimum: 0 },
        createdAt: date, updatedAt: date, __v: { type: "integer" }
    }
};

const membership = {
    type: "object", properties: {
        _id: id, userId: id, status: { type: "string", enum: ["submitted", "accepted", "rejected"] },
        source: { type: "string", enum: ["application", "referral"] }, submittedAt: date, decidedAt: date, decidedBy: id,
        createdAt: date, updatedAt: date, __v: { type: "integer" }
    }
};
const requirements = { type: "object", properties: { status: { const: "undecided" }, message: { type: "string" } } };
const membershipStatus = { type: "object", properties: { application: { anyOf: [membership, { type: "null" }] }, requirements } };
const checklist = { type: "object", properties: {
    currentStep: { type: "string" }, membershipRequirementsStatus: { const: "undecided" },
    requirements: { type: "array", items: { type: "object", properties: { key: { type: "string" }, complete: { type: "boolean" } } } },
    missingRequirements: strings
} };

export const candidateResponses = {
    profile: envelope(profile),
    checklist: envelope(checklist),
    upload: envelope({ type: "object", properties: { id, kind: { enum: ["photo", "resume"] }, contentType: { type: "string" }, size: { type: "integer" } } }),
    download: envelope({ type: "object", properties: { url: { type: "string", format: "uri" }, expiresIn: { type: "integer", example: 300 } } }),
    membershipStatus: envelope(membershipStatus),
    membership: envelope(membership),
    membershipList: envelope({ type: "array", items: membership }),
    membershipDetail: envelope({ type: "object", properties: { application: membership, profile: { anyOf: [profile, { type: "null" }] }, requirements } }),
    referral: envelope({ type: "object", properties: { code: { type: "string" } } })
};
