import type {
  CommercialProductCode,
  CommercialProductGroup,
  CommercialProductRecord,
} from "./types";

export function filterCommercialProducts(
  catalog: CommercialProductRecord[] | null | undefined,
  filters: {
    groups?: CommercialProductGroup[];
    codes?: CommercialProductCode[];
  },
): CommercialProductRecord[] {
  const groups = new Set(filters.groups ?? []);
  const codes = new Set(filters.codes ?? []);

  return (catalog ?? []).filter((product) => {
    const matchesGroup =
      groups.size === 0 || groups.has(product.productGroup);
    const matchesCode = codes.size === 0 || codes.has(product.productCode);
    return matchesGroup && matchesCode;
  });
}
