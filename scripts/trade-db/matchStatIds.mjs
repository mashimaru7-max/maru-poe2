// Adapted from slickdomi/poe2-better-trade-filter ae8f728 (MIT). See docs/licenses/trade-data-MIT.txt.
const LOCAL_SUFFIX = " (Local)";
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function normalizeRepoeText(text, rollMin, rollMax) {
    let normalized = text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$2").replace(/\[([^\]]+)\]/g, "$1").replace(/\(-?[\d.]+(?:-(?:-?[\d.]+))?\)/g, "#");
    if (rollMin !== undefined && rollMin === rollMax) {
        const pattern = new RegExp(`(?<![\\d.])${escapeRegExp(String(rollMin))}(?![\\d.])`);
        normalized = normalized.replace(pattern, "#");
    }
    return normalized.replace(/^\+/, "").replace(/\s+/g, " ").trim();
}
export function normalizeTradeText(text) {
    return text.replace(/\s+/g, " ").trim();
}
export function isLocalRepoeStatId(statId) {
    return statId.startsWith("local_");
}
export function buildTradeStatIndex(groups) {
    const index = new Map();
    for (const group of groups){
        const byText = new Map();
        for (const entry of group.entries){
            const key = normalizeTradeText(entry.text);
            if (!byText.has(key)) byText.set(key, entry);
        }
        index.set(group.id, byText);
    }
    return index;
}
export function buildLocalVariantIndex(index) {
    const localByGlobalId = new Map();
    for (const byText of index.values()){
        for (const [text, localEntry] of byText){
            if (!text.endsWith(LOCAL_SUFFIX)) continue;
            const globalEntry = byText.get(text.slice(0, -LOCAL_SUFFIX.length));
            if (globalEntry) localByGlobalId.set(globalEntry.id, localEntry.id);
        }
    }
    return localByGlobalId;
}
const RADIUS_JEWEL_WORDINGS = [
    "Small Passive Skills in Radius also grant ",
    "Notable Passive Skills in Radius also grant "
];
export function resolveRadiusJewelStatId(index, normalizedRepoeText, sourceBucket) {
    const explicit = index.get("explicit");
    const texts = new Set([
        normalizedRepoeText,
        normalizedRepoeText.replace(/\+#/g, "#")
    ]);
    const keys = new Set(RADIUS_JEWEL_WORDINGS.flatMap((wording)=>[
            ...texts
        ].map((text)=>`${wording}${text}`)).filter((key)=>explicit?.has(key)));
    const narrowed = keys.size > 1 && sourceBucket ? [
        ...keys
    ].filter((key)=>index.get(sourceBucket)?.has(key)) : [
        ...keys
    ];
    return narrowed.length === 1 ? explicit?.get(narrowed[0]) : undefined;
}
export function resolveTradeStatId(index, bucketOrder, normalizedRepoeText, preferLocal = false) {
    if (preferLocal) {
        for (const bucket of bucketOrder){
            const found = index.get(bucket)?.get(`${normalizedRepoeText}${LOCAL_SUFFIX}`);
            if (found) return found;
        }
    }
    for (const bucket of bucketOrder){
        const found = index.get(bucket)?.get(normalizedRepoeText);
        if (found) return found;
    }
    return undefined;
}
