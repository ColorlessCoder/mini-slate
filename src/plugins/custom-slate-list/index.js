import createCommands from "./create-commands";
import createNormalizeNode from "./create-normalize-node";
import createRenderNode from "./create-render-node";
import createSchema from "./create-schema";
import { isKeyHotkey } from 'is-hotkey';

export default (options = {}) => {
  const config = {
    ...options
  };

  const blocks = {
    unordered_list: "unordered-list",
    ordered_list: "ordered-list",
    list_item: "list-item",
    list_item_child: "list-item-child",
    default: "paragraph",
    child_block_list: ['paragraph', 'image'],
    maximumBlockInListItem: 3,
    maximumDepth: 3,
    ...config.blocks
  };

  const classNames = {
    unordered_list: "unordered-list",
    ordered_list: "ordered-list",
    list_item: "list-item",
    list_item_child: "list-item-child",
    ...config.classNames
  };

  const commands = createCommands({ blocks });

  const isListItem = block => block && block.type == blocks.list_item;

  const getListItem = (editor, block) => {
    const possibleListItem = editor.value.document.getParent(block.key);

    return isListItem(possibleListItem) ? possibleListItem : null;
  };

  const isList = block =>
    block &&
    (block.type == blocks.unordered_list || block.type == blocks.ordered_list);

  const getList = (editor, block) => {
    const possibleList = editor.value.document.getParent(block.key);
    return isList(possibleList) ? possibleList : null;
  };

  const onBackspace = (event, editor, next) => {
    const { selection } = editor.value;
    if (selection.isExpanded) return next();
    if (selection.start.offset !== 0) return next();
    const listItem = getListItem(editor, editor.value.startBlock);
    const list = getList(editor, listItem);
    const parentListItem = getListItem(editor, list);

    if (parentListItem) {
      editor.decreaseListItemDepth();
      return;
    }

    editor.unwrapList();
  };

  const onEnter = (event, editor, next) => {
    const { selection, startBlock } = editor.value;
    event.preventDefault();
    if (selection.isExpanded) editor.delete();
    if (selection.start.offset === 0 && startBlock.getText() === "") {
      const listItem = getListItem(editor, editor.value.startBlock);
      const list = getList(editor, listItem);
      const parentListItem = getListItem(editor, list);

      if (parentListItem) {
        editor.decreaseListItemDepth();
        return;
      }

      editor.unwrapList();

      return;
    }

    const listItem = getListItem(editor, editor.value.startBlock);

    editor.splitDescendantsByKey(
      listItem.key,
      selection.start.key,
      selection.start.offset
    );
  };

  const onShiftEnter = (event, editor, next) => {
    event.preventDefault();
    editor.insertText("\n");
  };

  
  const onKeyDown = (event, editor, next) => {
    if(getListItem(editor, editor.value.startBlock)) {
      if(isKeyHotkey('backspace')(event)) {
        console.log('backspace');
        event.preventDefault();
        onBackspace(event, editor, next);
      } else if(isKeyHotkey('enter')(event)) {
        console.log('enter');
        event.preventDefault();
        onEnter(event, editor, next);
      } else if(isKeyHotkey('shift+enter')(event)) {
        console.log('shift+enter');
        event.preventDefault();
        onShiftEnter(event, editor, next);
      } else if(isKeyHotkey('tab')(event)) {
        console.log('tab');
        event.preventDefault();
        editor.increaseListItemDepth();
      } else if(isKeyHotkey('shift+tab')(event)) {
        console.log('shift+tab');
        event.preventDefault();
        editor.decreaseListItemDepth();
      }
    } else {
      return next();
    }
  }

  const schema = createSchema({ blocks });
  const normalizeNode = createNormalizeNode({ blocks });
  const renderNode = createRenderNode({ blocks, classNames });

  return [
    {
      commands: {
        wrapList: commands.wrapList,
        unwrapList: commands.unwrapList,
        toggleList: commands.toggleList,
        decreaseListItemDepth: commands.decreaseListItemDepth,
        increaseListItemDepth: commands.increaseListItemDepth
      },
      normalizeNode,
      renderNode,
      schema,
      onKeyDown
    }
  ];
};
