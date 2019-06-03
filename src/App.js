import React from 'react';
import { Editor } from 'slate-react';
import { Block, Value } from 'slate';
import { cx, css } from "emotion";
import { Toolbar } from './components/Toolbar';
import { Icon } from './components/Icon';
import { Button } from './components/Button';
import { isKeyHotkey } from 'is-hotkey';
import { FileUpload } from './components/FileUpload';
import { Image } from './components/ImageBlock';
import { FileBlock } from './components/FileBlock';
const DEFAULT_NODE = 'paragraph';
const MAX_RIGHT_INDENT_LIMIT = 3;
const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'A line of text in a paragraph.',
              },
            ],
          },
        ],
      },
    ],
  },
});

const isBoldHotKey = isKeyHotkey('mod+b');
const isItalicHotKey = isKeyHotkey('mod+i');
const isUnderlinedHotKey = isKeyHotkey('mod+u');
const isCodeHotKey = isKeyHotkey('mod+`');
const isStrikeThroughHotKey = isKeyHotkey('mod+d');
const isTabKey = isKeyHotkey('tab');
const isShiftTabKey = isKeyHotkey('shift+tab');

const schema = {
  document: {
    last: { type: 'paragraph' },
    normalize: (editor, { code, node, child }) => {
      switch (code) {
        case 'last_child_type_invalid': {
          const paragraph = Block.create('paragraph')
          return editor.insertNodeByKey(node.key, node.nodes.size, paragraph)
        }
        default: break;
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
    },
    file: {
      isVoid: true,
    },
  },
}
// Define our app...
class App extends React.Component {
  // Set the initial value when the app is first constructed.
  state = {
    value: initialValue,
  }

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }) => {
    this.setState({ value })
  }

  ref = (editor) => {
    this.editor = editor;
  }

  imageInputRef = React.createRef();
  fileInputRef = React.createRef();

  renderMarkButton = (type, icon) => {
    const { value } = this.state;
    const active = value.activeMarks.some(mark => mark.type === type);
    return (
      <Button onClick={event => this.clickMark(event, type)} active={active}>
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  renderBlockButton = (type, icon) => {
    const { value } = this.state;
    const active = value.blocks.some(node => node.type === type);
    return (
      <Button onClick={event => this.clickBlock(event, type)} active={active}>
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  clickMark = (event, type) => {
    event.preventDefault();
    this.editor.toggleMark(type);
  }

  clickBlock = (event, type) => {
    event.preventDefault();
    const { value } = this.state;
    const active = value.blocks.some(block => block.type === type);
    if (type === 'image') {
      this.startImageUpload();
    } else if (type === 'file') {
      this.startFileUpload();
    } else if (['unordered-list', 'number-list'].includes(type)) {
      const listExists = value.blocks.some(block => block.type === 'list-item');
      const typeExists = value.blocks.some(block => {
        return !!value.document.getClosest(block.key, node => node.type === type);
      });

      if (listExists && typeExists) {
        this.editor
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('unordered-list')
          .unwrapBlock('number-list');
      } else if (listExists) {
        this.editor
          .unwrapBlock(type === 'unordered-list' ? 'number-list' : 'unordered-list')
          .setBlocks(DEFAULT_NODE)
          .setBlocks('list-item')
          .wrapBlock(type);
      } else {
        this.editor.setBlocks('list-item').wrapBlock(type);
      }
    } else {
      this.editor.setBlocks(!active ? type : DEFAULT_NODE);
    }
  }

  listIndentRight = () => {
    const { value } = this.state;
    const isNumberList = value.blocks.some(block => {
      return !!value.document.getClosest(block.key, parent => parent.type === 'number-list');
    });
    const isUnOrderedList = value.blocks.some(block => {
      return !!value.document.getClosest(block.key, parent => parent.type === 'unordered-list');
    });
    const listType = isUnOrderedList ? 'unordered-list': 'number-list';
    if(isNumberList && isUnOrderedList) {
      return;
    }
    const canContinue = !value.blocks.some(block => {
      return block.type !== 'list-item' || value.document.getAncestors(block.key).toArray().filter(node => node.type === listType).length >= MAX_RIGHT_INDENT_LIMIT
    });
    if(canContinue) {
      this.editor
        .setBlocks('list-item')
        .wrapBlock(listType);
    }
  }

  listIndentLeft = () => {
    const { value } = this.state;
    const isNumberList = value.blocks.some(block => {
      return !!value.document.getClosest(block.key, parent => parent.type === 'number-list');
    });
    const isUnOrderedList = value.blocks.some(block => {
      return !!value.document.getClosest(block.key, parent => parent.type === 'unordered-list');
    });
    if(isNumberList && isUnOrderedList) {
      return;
    }
    const listType = isUnOrderedList ? 'unordered-list': 'number-list';
    const canContinue = !value.blocks.some(block => {
      return block.type !== 'list-item' || value.document.getAncestors(block.key).toArray().filter(node => node.type === listType).length <=1;
    });
    if(canContinue) {
      this.editor
      .unwrapBlock(listType)
      .setBlocks('list-item')
    }
  }

  onKeyDown = (event, editor, next) => {
    let mark;
    if (isBoldHotKey(event)) {
      mark = 'bold'
    } else if (isUnderlinedHotKey(event)) {
      mark = 'underlined'
    } else if (isItalicHotKey(event)) {
      mark = 'italic'
    } else if (isCodeHotKey(event)) {
      mark = 'code'
    } else if (isStrikeThroughHotKey(event)) {
      mark = 'strikethrough'
    } else if(isTabKey(event)){
      event.preventDefault();
      this.listIndentRight();
      return next();
    } else if(isShiftTabKey(event)){
      event.preventDefault();
      this.listIndentLeft();
      return next();
    } else {
      return next();
    }
    event.preventDefault();
    editor.toggleMark(mark);
  }

  renderMark = (props, editor, next) => {
    const { children, attributes, mark } = props;
    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>;
      case 'italic':
        return <em {...attributes}>{children}</em>;
      case 'code':
        return <code {...attributes}>{children}</code>;
      case 'underlined':
        return <u {...attributes}>{children}</u>;
      case 'strikethrough':
        return <del {...attributes}>{children}</del>;
      default:
        return next();
    }
  }

  renderBlock = (props, editor, next) => {
    const { children, node, attributes } = props;
    switch (node.type) {
      case 'image':
        return <Image {...props} />;
      case 'file':
        return <FileBlock {...props} />;
      case 'header-1':
        return <h1 {...attributes}>{children}</h1>;
      case 'header-2':
        return <h2 {...attributes}>{children}</h2>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'unordered-list':
        return <ul {...attributes}>{children}</ul>;
      case 'number-list':
        return <ol {...attributes}>{children}</ol>;
      default:
        return next();
    }
  }

  startFileUpload = () => {
    this.fileInputRef.current.click();
  }

  startImageUpload = () => {
    this.imageInputRef.current.click();
  }

  imageInputCompletion = () => {
    const file = this.imageInputRef.current.files[0];
    this.handleImageInsert(file);
  }

  fileInputCompletion = () => {
    const file = this.fileInputRef.current.files[0];
    if (!file) return;
    if (!this.handleImageInsert(file)) {
      this.handleFileInsert(file);
    }
  }

  handleFileInsert = (file) => {
    if (!file) return false;
    const fileReader = new FileReader();
    if (file.type.includes('application/pdf') || file.type.includes('text/plain')) {
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        this.editor.command(this.createFileBlock, fileReader.result, file.name,
          file.type.includes('application/pdf') ? 'pdf' : 'txt'
        );
        this.fileInputRef.current.value = null;
      }
      return true;
    }
    return false;
  }

  handleImageInsert = (file) => {
    if (!file) return false;
    const fileReader = new FileReader();
    if (file.type.includes('image/')) {
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        this.editor.command(this.createImageBlock, fileReader.result, file.name);
        this.imageInputRef.current.value = null;
        this.fileInputRef.current.value = null;
      }
      return true;
    }
    return false;
  }

  createImageBlock = (editor, src, alt) => {
    editor.insertBlock({
      type: 'image',
      data: {
        src,
        alt
      }
    });
  }

  createFileBlock = (editor, src, alt, fileType) => {
    editor.insertBlock({
      type: 'file',
      data: {
        src,
        alt,
        fileType
      }
    });
  }

  render() {
    return (
      <div style={{ width: '60%', backgroundColor: 'white', margin: '10px auto', padding: '20px' }}>
        <Toolbar>
          {this.renderMarkButton('bold', 'format_bold')}
          {this.renderMarkButton('italic', 'format_italic')}
          {this.renderMarkButton('underlined', 'format_underline')}
          {this.renderMarkButton('strikethrough', 'strikethrough_s')}
          {this.renderMarkButton('code', 'code')}
          {this.renderBlockButton('header-1', 'looks_one')}
          {this.renderBlockButton('header-2', 'looks_two')}
          {this.renderBlockButton('unordered-list', 'format_list_bulleted')}
          {this.renderBlockButton('number-list', 'format_list_numbered')}
          {this.renderBlockButton('image', 'insert_photo')}
          {this.renderBlockButton('file', 'attach_file')}
          <FileUpload accepttype={'image'} ref={this.imageInputRef} onChange={this.imageInputCompletion} />
          <FileUpload ref={this.fileInputRef} onChange={this.fileInputCompletion} />
        </Toolbar>
        <Editor
          ref={this.ref}
          schema={schema}
          value={this.state.value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderMark={this.renderMark}
          renderBlock={this.renderBlock}
        />
      </div>
    )
  }
}

export default App;