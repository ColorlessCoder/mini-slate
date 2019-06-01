import React from 'react';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import { cx, css } from "emotion";
import { Toolbar } from './components/Toolbar';
import { Icon } from './components/Icon';
import { Button } from './components/Button';
import { isKeyHotkey } from 'is-hotkey';
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

const isBoldHotKey= isKeyHotkey('mod+b');
const isItalicHotKey= isKeyHotkey('mod+i');
const isUnderlinedHotKey= isKeyHotkey('mod+u');
const isCodeHotKey= isKeyHotkey('mod+`');
const isStrikeThroughHotKey= isKeyHotkey('mod+d');

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

  renderMarkButton = (type, icon) => {
    const {value} = this.state;
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
    if(isBoldHotKey(event)) {
      mark = 'bold'
    } else if(isUnderlinedHotKey(event)) {
      mark = 'underlined'
    } else if(isItalicHotKey(event)) {
      mark = 'italic'
    } else if(isCodeHotKey(event)) {
      mark = 'code'
    } else if(isStrikeThroughHotKey(event)) {
      mark = 'strikethrough'
    } else {
      return next();
    }
    event.preventDefault();
    editor.toggleMark(mark);
  }

  renderMark = (props, editor, next) => {
    const {children, attributes, mark} = props;
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

  render() {
    return <div>
      <Toolbar>
        {this.renderMarkButton('bold', 'format_bold')}
        {this.renderMarkButton('italic', 'format_italic')}
        {this.renderMarkButton('underlined', 'format_underline')}
        {this.renderMarkButton('strikethrough', 'strikethrough_s')}
        {this.renderMarkButton('code', 'code')}
        <Button ><Icon>format_list_bulleted</Icon></Button>
        <Button ><Icon>format_list_numbered</Icon></Button>
        <Button ><Icon>insert_photo</Icon></Button>
        <Button ><Icon>attach_file</Icon></Button>
      </Toolbar>
      <Editor 
        ref={this.ref} 
        value={this.state.value} 
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        renderMark={this.renderMark}
        />
    </div>
  }
}

export default App;