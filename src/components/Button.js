import React from 'react';
import { cx, css } from 'emotion';

export const Button = React.forwardRef(({ className, active, ...props }, ref) => {
    return (
        <span
            {...props}
            ref={ref}
            className={
                cx(
                    className,
                    css`
                        cursor: pointer;
                        color: ${active ? 'black': '#ccc'}
                    `
                )
            }
        />
    );
})