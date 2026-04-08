import { useMemo } from 'react';

interface ResponsiveTypographyOptions {
  baseSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
  tracking?: 'tight' | 'normal' | 'wide';
  truncate?: 1 | 2 | 3;
}

interface ResponsiveClasses {
  mobile: string;
  tablet: string;
  desktop: string;
  large: string;
  xlarge: string;
}

const useResponsiveTypography = (options: ResponsiveTypographyOptions = {}) => {
  const {
    baseSize = 'base',
    weight = 'normal',
    lineHeight = 'normal',
    tracking = 'normal',
    truncate
  } = options;

  const classes = useMemo(() => {
    const sizeClass = baseSize;
    const weightClass = weight !== 'normal' ? `font-${weight}` : '';
    const lineHeightClass = lineHeight !== 'normal' ? `leading-${lineHeight}` : '';
    const trackingClass = tracking !== 'normal' ? `tracking-${tracking}` : '';
    const truncateClass = truncate ? `text-clamp-${truncate}` : '';

    const baseClasses = [
      sizeClass,
      weightClass,
      lineHeightClass,
      trackingClass,
      truncateClass
    ].filter(Boolean).join(' ');

    return {
      mobile: baseClasses,
      tablet: baseClasses, // Same as mobile, handled by CSS
      desktop: baseClasses, // Same as mobile, handled by CSS
      large: baseClasses, // Same as mobile, handled by CSS
      xlarge: baseClasses // Same as mobile, handled by CSS
    };
  }, [baseSize, weight, lineHeight, tracking, truncate]);

  return classes;
};

export default useResponsiveTypography;
