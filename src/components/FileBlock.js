import React from 'react';
import { cx, css } from 'emotion';

export const FileBlock = (props) => {
    const { node, attributes, isFocused, className } = props;
    const pdfSrc = 'https://image.flaticon.com/icons/svg/29/29587.svg';
    const txtSrc = 'https://cdn0.iconfinder.com/data/icons/file-extension-line-icon/100/txtb-512.png';
    let triggerDownload = (event) => {
        if (window.confirm('Download the file?')) {
            const link = document.createElement('a');
            link.download = node.data.get('alt');
            link.href = node.data.get('src');
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        event.preventDefault();
    }
    return (
        <img
            {...attributes}
            onClick={(event) => triggerDownload(event)}
            src={node.data.get('fileType') === 'pdf' ? pdfSrc : txtSrc}
            alt={node.data.get('alt')}
            className={
                cx(
                    className,
                    css`
                        cursor: pointer;
                        display: block;
                        max-width: 100%;
                        max-height: 20em;
                        box-shadow: ${isFocused ? '0 0 0 2px blue;' : 'none'};
                    `
                )
            }
        />
    );
};