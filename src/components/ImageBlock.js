import React from 'react';
import { cx, css } from 'emotion';

export const Image = (props) => {
    const {node, attributes, isFocused, className} = props;
    return (
        <img
            {...attributes}
            src={node.data.get('src')}
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
}