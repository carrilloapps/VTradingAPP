import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface XIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const XIcon: React.FC<XIconProps> = ({ size = 24, color = '#000', ...props }) => {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            {...props}
        >
            <Path
                d="M18.901 3H21.68l-6.069 6.936L22.741 21h-5.588l-4.376-5.718L7.778 21H4.996l6.488-7.415L4 3h5.729l4.004 5.23L18.901 3zM17.926 19.364h1.54L8.91 4.545H7.258l10.668 14.819z"
                fill={color}
            />
        </Svg>
    );
};

export default XIcon;
