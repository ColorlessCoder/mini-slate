import React from 'react';
import { Editor } from 'slate-react';
import { Block, Value } from 'slate';
import { Toolbar } from './components/Toolbar';
import { Icon } from './components/Icon';
import { Button } from './components/Button';
import { isKeyHotkey } from 'is-hotkey';
import { FileUpload } from './components/FileUpload';
import { Image } from './components/ImageBlock';
import { FileBlock } from './components/FileBlock';
import Lists from './plugins/custom-slate-list/index';
import lodash from 'lodash';
const DEFAULT_NODE = 'paragraph';
const MAX_RIGHT_INDENT_LIMIT = 3;
const INITIAL_VALUE = {
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
      },
    ],
  }
};
const isBoldHotKey = isKeyHotkey('mod+b');
const isItalicHotKey = isKeyHotkey('mod+i');
const isUnderlinedHotKey = isKeyHotkey('mod+u');
const isCodeHotKey = isKeyHotkey('mod+`');
const isStrikeThroughHotKey = isKeyHotkey('mod+d');

const plugins = [Lists({
  blocks: {
    ordered_list: "ordered-list",
    unordered_list: "unordered-list",
    list_item: "list-item",
    maximumDepth: MAX_RIGHT_INDENT_LIMIT,
    child_block_list: ['paragraph', 'image'],
  }
})]
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

class App extends React.Component {
  constructor(props) {
    super(props);
    const value = window.localStorage.getItem('editorValue') ? Value.fromJSON(JSON.parse(lodash.cloneDeep(window.localStorage.getItem('editorValue')))) : Value.fromJSON(INITIAL_VALUE);
    const blockLimit = window.localStorage.getItem('blockLimit') ? Number.parseInt(window.localStorage.getItem('blockLimit')) : -1
    this.state = {
      value,
      blockLimit
    }
  }

  onChange = ({ value }) => {
    this.setState({
      value
    })
  }

  ref = (editor) => {
    this.editor = editor;
  }

  saveEditor = () => {
    window.localStorage.setItem('editorValue', JSON.stringify(this.state.value.toJSON()));
    window.localStorage.setItem('blockLimit', this.state.blockLimit);
  }

  cancelChanges = () => {
    this.setState({
      value: window.localStorage.getItem('editorValue') ? Value.fromJSON(JSON.parse(lodash.cloneDeep(window.localStorage.getItem('editorValue')))) : Value.fromJSON(INITIAL_VALUE),
      blockLimit: window.localStorage.getItem('blockLimit') ? Number.parseInt(window.localStorage.getItem('blockLimit')) : -1
    });
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
    let active = value.blocks.some(node => node.type === type);
    if (['unordered-list', 'ordered-list']) {
      active = active || value.blocks.some(node => {
        return !!value.document.getClosest(node.key, parent => parent.type === type);
      });
    }
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
    } else if (['unordered-list', 'ordered-list'].includes(type)) {
      this.editor.toggleList({ type: type });
    } else {
      this.editor.setBlocks(!active ? type : DEFAULT_NODE);
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
      case 'ordered-list':
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
    console.log(this.state.value.document.getRootBlocksAtRange());
    const disableSave = this.state.blockLimit > 0
      && this.state.value
      && this.state.value.document ? this.state.value.document.getRootBlocksAtRange().toArray().length > this.state.blockLimit : false;
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
          {this.renderBlockButton('ordered-list', 'format_list_numbered')}
          {this.renderBlockButton('image', 'insert_photo')}
          {this.renderBlockButton('file', 'attach_file')}
          <FileUpload accepttype={'image'} ref={this.imageInputRef} onChange={this.imageInputCompletion} />
          <FileUpload ref={this.fileInputRef} onChange={this.fileInputCompletion} />
          <Button active={true} style={{ float: 'right' }} onClick={this.cancelChanges}><Icon>cancel</Icon></Button>
          <Button active={!disableSave} style={{ float: 'right' }} onClick={!disableSave ? this.saveEditor : () => { }}><Icon>save</Icon></Button>
          <input type="number" style={{
            height: '100%',
            fontSize: '18px',
            width: '100px',
            verticalAlign: 'text-bottom',
            float: 'right'
          }} placeholder='Block Limit' value={this.state.blockLimit} onChange={(event) => {
            const val = !Number.isNaN(event.target.value) ? event.target.value : 0;
            this.setState({ blockLimit: val });
          }} />
        </Toolbar>
        <Editor
          ref={this.ref}
          schema={schema}
          plugins={plugins}
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