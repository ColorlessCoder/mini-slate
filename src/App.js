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

  renderMarkButton = (type, icon) => {
    const { value } = this.state;
    const active = value.activeMarks.some(mark => mark.type === type);
    return (
      <Button onClick={event => this.clickMark(event, type)} active={active}>
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  clickMark = (event, type) => {
    event.preventDefault();
    this.editor.toggleMark(type);
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
    const { children, isFocused, node } = props;
    switch (node.type) {
      case 'image':
        return <Image {...props} />;
      default:
        return next();
    }
  }

  startImageUpload = () => {
    this.imageInputRef.current.click();
  }

  imageInputCompletion = () => {
    const fileReader = new FileReader();
    const file = this.imageInputRef.current.files[0];
    if (file.type.includes('image/')) {
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        this.editor.command(this.createImageBlock, fileReader.result, file.name);
        this.imageInputRef.current.value = null;
      }
    }
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

  render() {
    return (
      <div style={{ width: '60%', backgroundColor: 'white', margin: '10px auto', padding: '20px' }}>
        <Toolbar>
          {this.renderMarkButton('bold', 'format_bold')}
          {this.renderMarkButton('italic', 'format_italic')}
          {this.renderMarkButton('underlined', 'format_underline')}
          {this.renderMarkButton('strikethrough', 'strikethrough_s')}
          {this.renderMarkButton('code', 'code')}
          <Button ><Icon>format_list_bulleted</Icon></Button>
          <Button ><Icon>format_list_numbered</Icon></Button>
          <Button onClick={this.startImageUpload} ><Icon>insert_photo</Icon></Button>
          <Button ><Icon>attach_file</Icon></Button>
          <FileUpload accepttype={'image'} ref={this.imageInputRef} onChange={this.imageInputCompletion} />
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