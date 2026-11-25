import { getCandidateProfile } from "./candidate.service.ts";

type OnboardingProfile = {
    firstName: string;
    function: string;
    specializations: string[];
    skills: string[];
    industries: string[];
    locations: string[];
    remotePreference: string;
    currentStep: string;
};

export const buildCandidateOnboarding = (profile: OnboardingProfile) => {
    const requirements = [
        { key: "firstName", complete: !!profile.firstName },
        { key: "function", complete: !!profile.function },
        { key: "specializations", complete: profile.specializations.length > 0 },
        { key: "skills", complete: profile.skills.length >= 3 },
        { key: "industries", complete: profile.industries.length > 0 },
        { key: "locations", complete: profile.locations.length > 0 || profile.remotePreference === "yes" }
    ];

    return {
        currentStep: profile.currentStep,
        membershipRequirementsStatus: "undecided",
        requirements,
        missingRequirements: requirements.filter(requirement => !requirement.complete).map(requirement => requirement.key)
    };
};

export const getCandidateOnboarding = async (userId: string) => {
    const profile = await getCandidateProfile(userId);
    return buildCandidateOnboarding(profile);
};
