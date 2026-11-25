export type CandidateAssetKind = "photo" | "resume";
export type AssetResourceType = "image" | "raw";

export interface ValidatedAsset {
    kind: CandidateAssetKind;
    buffer: Buffer;
    contentType: string;
    resourceType: AssetResourceType;
    extension: string;
}
