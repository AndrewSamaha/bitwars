import { Document, isMap, isNode, isScalar, visit } from "yaml";

/** Sort mappings recursively while retaining comments and sequence order. */
function sortMappings(node: Parameters<typeof visit>[0]) {
  visit(node, {
    Map(_key, map) {
      map.items.sort((a, b) => {
        const left = String(isScalar(a.key) ? a.key.value : a.key);
        const right = String(isScalar(b.key) ? b.key.value : b.key);
        return left < right ? -1 : left > right ? 1 : 0;
      });
    },
  });
}

export function stringifyEntityDefinition(value: unknown): string {
  const document = new Document(value);
  sortMappings(document);
  return document.toString().trim();
}

/** Leave entity IDs and other content sections in their authored order. */
export function sortEntityDefinitions(document: Document): Document {
  const entities = document.get("entity_types", true);
  if (isMap(entities)) {
    for (const entity of entities.items) {
      // YAMLMap.set also accepts plain objects; materialize newly added entities
      // before visiting so their fields receive the same ordering as existing ones.
      if (!isNode(entity.value))
        entity.value = document.createNode(entity.value);
      sortMappings(entity.value as Parameters<typeof visit>[0]);
    }
  }
  return document;
}
