import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface FacebookIconProps extends SvgProps {
  size?: number;
  color?: string;
}

const FacebookIcon: React.FC<FacebookIconProps> = ({
  size = 24,
  color = '#1877F2',
  ...props
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M14 14.5h3.5l.5-3.5h-4V8.5c0-1 .5-1.5 1.5-1.5h2.5V3.5h-3c-3 0-4.5 2-4.5 4.5V11H7v3.5h3.5V21h3.5v-6.5z"
        fill={color}
      />
    </Svg>
  );
};

export default FacebookIcon;
