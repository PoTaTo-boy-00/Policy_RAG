import type { HybridSearchResType } from "../retrival/hybridSearch.js";

export const deduplication = (
  hybridRes: HybridSearchResType[],
): HybridSearchResType[] => {
  const frequency = new Set<string>();
  const uniquesRes: HybridSearchResType[] = [];
  hybridRes.forEach((res) => {
    if (!frequency.has(res.id)) {
      frequency.add(res.id);
      uniquesRes.push(res);
    }
  });
  return uniquesRes;
};
