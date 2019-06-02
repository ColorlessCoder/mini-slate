import React from 'react';
import { cx, css } from 'emotion';

export const FileUpload = React.forwardRef(({ ...props }, ref) => {
    let accept;
    const {accepttype} = props;
    if(accepttype === 'image') {
        accept = 'image/*';
    }
    return (
        <input
            {...props}
            type='file'
            ref={ref}
            accept={accept}
            className={
                cx(
                    css`
                        display: none
                    `
                )
            }
        />
    );
})