import type { RootContent} from "mdast"
export function getText(node: RootContent): string {

  if (node.type === "text") {
    return node.value;
  }
//   console.log(node)
  if (!("children" in node)) {
    return "";
  }

  return node.children
    .map((child: RootContent) => getText(child))
    .join("");
}