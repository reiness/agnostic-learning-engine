import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const iconMap = {
  sun: FaSun,
  moon: FaMoon,
};

const Icon = ({ name, ...props }) => {
  const IconComponent = iconMap[name];
  return IconComponent ? <IconComponent {...props} /> : null;
};

export default Icon;