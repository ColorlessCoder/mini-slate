import unwrapListByKey from "./unwrap-list-by-key";

export default ({ blocks }, editor) => {
  const listItemChildren = editor.value.document
    .getNodesAtRange(editor.value.selection)
    .filter(node => {
      return !!editor.value.document.getFurthest(
        node.key,
        node2 => node2.type === blocks.list_item
      );
    });
  
  const keySet = new Set();
  const furthestListItems = listItemChildren
    .map(listItemChild => {
      return editor.value.document.getFurthest(
        listItemChild.key,
        node => node.type == blocks.list_item
      );
    })
    .filter(
      (listItemChild, index, array) => array.indexOf(listItemChild) == index
    )
    .filter(
      node => {
        if(keySet.has(node.key)) return false;
        keySet.add(node.key);
        return true;
      }
    );

  furthestListItems.forEach(listItem => {
    unwrapListByKey({ blocks }, editor, listItem.key);
  });
};
