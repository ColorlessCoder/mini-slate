import React from 'react';
import { cx, css } from 'emotion';

export const Icon = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <i
            {...props}
            ref={ref}
            className={
                cx(
                    'material-icons',
                    className,
                    css`
                        font-size: 18px,
                        vertical-align: text-bottom
                    `
                )
            }
        />
    );
})