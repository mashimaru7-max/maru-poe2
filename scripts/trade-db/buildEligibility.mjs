// Adapted from slickdomi/poe2-better-trade-filter ae8f728 (MIT). See docs/licenses/trade-data-MIT.txt.
export function flattenModsByBase(modsByBase) {
    const tagKeyToModIds = new Map();
    for (const category of Object.values(modsByBase)){
        for (const [tagKey, entry] of Object.entries(category)){
            const modIds = [];
            for (const groupDict of Object.values(entry.mods ?? {})){
                for (const modIdMap of Object.values(groupDict)){
                    modIds.push(...Object.keys(modIdMap));
                }
            }
            const existing = tagKeyToModIds.get(tagKey);
            if (existing) existing.push(...modIds);
            else tagKeyToModIds.set(tagKey, modIds);
        }
    }
    return tagKeyToModIds;
}
export function eligibleModIdsForItemClasses(itemClasses, baseItems, tagKeyToModIds) {
    const result = new Set();
    for (const base of Object.values(baseItems)){
        if (!itemClasses.includes(base.item_class)) continue;
        for (const implicitId of base.implicits ?? [])result.add(implicitId);
        const tagKey = base.tags.join(",");
        const modIds = tagKeyToModIds.get(tagKey);
        if (modIds) for (const id of modIds)result.add(id);
    }
    return result;
}
export function residualEligibleModIds(itemClasses, baseItems, residualMods) {
    const result = new Set();
    for (const base of Object.values(baseItems)){
        if (!itemClasses.includes(base.item_class)) continue;
        const baseTagSet = new Set(base.tags);
        for (const [modId, mod] of residualMods){
            if (mod.spawn_weights.some((sw)=>sw.weight > 0 && baseTagSet.has(sw.tag))) {
                result.add(modId);
            }
        }
    }
    return result;
}
export function residualEligibleModIdsForBase(base, residualMods) {
    const baseTagSet = new Set(base.tags);
    return residualMods.filter(([, mod])=>mod.spawn_weights.some((sw)=>sw.weight > 0 && baseTagSet.has(sw.tag))).map(([id])=>id);
}
export function isRadiusJewelOnlyMod(mod) {
    const spawnTags = mod.spawn_weights.filter((sw)=>sw.weight > 0).map((sw)=>sw.tag);
    return spawnTags.length > 0 && spawnTags.every((tag)=>tag.endsWith("radius_jewel"));
}
export function collectCoveredModIds(tagKeyToModIds) {
    const covered = new Set();
    for (const modIds of tagKeyToModIds.values()){
        for (const id of modIds)covered.add(id);
    }
    return covered;
}
export function buildResidualMods(mods, covered) {
    return Object.entries(mods).filter(([id, m])=>!covered.has(id) && m.generation_type !== "unique" && m.text && m.stats.length === 1 && m.spawn_weights.length > 0);
}
