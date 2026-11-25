import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const selection = z.string().trim().min(1).max(100);
const selections = (max: number) => z.array(selection).max(max).refine(values => new Set(values.map(value => value.toLowerCase())).size === values.length, "Selections must be unique");

export const candidateProfileSchema = z.object({ body: z.strictObject({
    version: z.number().int().min(0),
    firstName: text(100).optional(),
    headline: text(150).optional(),
    about: text(600).optional(),
    function: text(100).optional(),
    specializations: selections(3).optional(),
    skills: selections(50).optional(),
    industries: selections(50).optional(),
    locations: selections(50).optional(),
    remotePreference: z.enum(["yes", "no", "undecided"]).optional(),
    visibility: z.enum(["anonymous", "open"]).optional(),
    hiddenEmployers: selections(100).optional(),
    hiddenFromAll: z.boolean().optional(),
    currentStep: z.enum(["account", "import", "profile", "function", "specializations", "skills", "industries", "locations", "visibility"]).optional()
}).refine(data => Object.keys(data).length > 1, "Provide at least one profile field") });

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>["body"];
