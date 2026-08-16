import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from '@hugeicons/react-native';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import * as React from 'react';
import { withUniwind } from 'uniwind';

type IconSource = LucideIcon | IconSvgElement;

// Hugeicons narrows `strokeWidth` to `number` where Lucide/SvgProps allows
// `NumberProp`, so take the narrower one to keep both branches assignable.
type IconProps = Omit<LucideProps, 'strokeWidth'> &
  Pick<HugeiconsProps, 'altIcon' | 'showAlt' | 'strokeWidth'> & {
    as: IconSource;
  };

/** Lucide ships components, Hugeicons ships `[tag, attrs]` tuple arrays. */
function isHugeicon(source: IconSource): source is IconSvgElement {
  return Array.isArray(source);
}

function IconImpl({ as: source, altIcon, showAlt, ...props }: IconProps) {
  if (isHugeicon(source)) {
    return <HugeiconsIcon icon={source} altIcon={altIcon} showAlt={showAlt} {...props} />;
  }
  const IconComponent = source;
  return <IconComponent {...props} />;
}

const StyledIcon = withUniwind(IconImpl, {
  size: {
    fromClassName: 'className',
    styleProperty: 'width',
  },
  color: {
    fromClassName: 'className',
    styleProperty: 'color',
  },
});

/**
 * A wrapper component for Lucide and Hugeicons icons with Uniwind `className`
 * support via `withUniwind`.
 *
 * Pass a Lucide icon component or a Hugeicons icon (an `IconSvgElement` array)
 * to `as` — the correct renderer is picked automatically, so both icon sets are
 * styled the same way. Size comes from the `size-*` class and color from the
 * `text-*` class, so icons inherit surrounding text color inside `Text`-styled
 * contexts.
 *
 * @component
 * @example
 * ```tsx
 * import Kaaba01Icon from '@hugeicons/core-free-icons/Kaaba01Icon';
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500 size-4" />
 * <Icon as={Kaaba01Icon} className="text-primary size-16" />
 * ```
 *
 * @param {IconSource} as - The Lucide icon component or Hugeicons icon to render.
 * @param {string} className - Utility classes to style the icon using Uniwind.
 * @param {number} size - Icon size (overrides the size class).
 * @param {IconSvgElement} altIcon - Hugeicons only: alternate icon for `showAlt`.
 * @param {...LucideProps} ...props - Additional icon props passed to the "as" icon.
 */
function Icon({ as: source, className, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  return (
    <StyledIcon
      as={source}
      className={cn('text-foreground size-5', textClass, className)}
      {...props}
    />
  );
}

export { Icon };
