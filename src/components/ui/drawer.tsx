import * as DialogPrimitive from '@rn-primitives/dialog';
import { X } from 'lucide-react-native';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { cn } from '@/lib/utils';

/**
 * A bottom drawer.
 *
 * Built on the same `@rn-primitives/dialog` primitive as `ui/dialog.tsx` -- the
 * difference is purely presentation, so it inherits the portal, the iOS
 * `FullWindowOverlay`, backdrop-to-dismiss and the focus semantics for free,
 * and it works on web where a native sheet would not.
 *
 * Dismissed by tapping the backdrop or the close button; the grabber is an
 * affordance rather than a drag target.
 */

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

/** How far the grabber must travel before releasing dismisses the drawer. */
const DRAG_CLOSE_DISTANCE = 110;
/** A flick this fast dismisses regardless of distance. */
const DRAG_CLOSE_VELOCITY = 900;
const SETTLE_SPRING = { damping: 20, stiffness: 220, mass: 0.6 } as const;

function DrawerOverlay({
  className,
  children,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, 'asChild'> & {
  children?: React.ReactNode;
}) {
  const { onOpenChange } = DialogPrimitive.useRootContext();

  function onOverlayPress(event: GestureResponderEvent) {
    onPress?.(event);
    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {
      onOpenChange(false);
    }
  }

  return (
    <FullWindowOverlay>
      {/* iOS renders FullWindowOverlay into its own UIWindow, outside the root
          GestureHandlerRootView, so gestures in here need a root of their own or
          the pan is silently dead. Harmless nesting on the other platforms. */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <DialogPrimitive.Overlay
          className={cn(
            // Anchored to the bottom rather than centred. No horizontal padding:
            // the drawer runs edge to edge.
            'absolute bottom-0 left-0 right-0 top-0 z-50 flex justify-end bg-black/50',
            Platform.select({
              web: 'animate-in fade-in-0 fixed cursor-default [&>*]:cursor-auto',
            }),
            className
          )}
          {...props}
          onPress={Platform.select({ web: onOverlayPress, native: onPress })}
          asChild={Platform.OS !== 'web'}>
          <NativeOnlyAnimatedView
            entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
            as="Pressable">
            {/* The panel slides rather than fades -- that motion is what reads
                as a drawer instead of a bottom-aligned dialog. */}
            <NativeOnlyAnimatedView
              entering={SlideInDown.duration(280).reduceMotion(ReduceMotion.System)}
              exiting={SlideOutDown.duration(200).reduceMotion(ReduceMotion.System)}>
              <>{children}</>
            </NativeOnlyAnimatedView>
          </NativeOnlyAnimatedView>
        </DialogPrimitive.Overlay>
      </GestureHandlerRootView>
    </FullWindowOverlay>
  );
}

function DrawerContent({
  className,
  portalHost,
  children,
  heightRatio,
  maxHeightRatio = 0.9,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  portalHost?: string;
  /**
   * Fixed height as a fraction of the screen. Use for drawers holding a
   * scrolling list, so the panel does not resize as the list filters.
   */
  heightRatio?: number;
  /** Ceiling as a fraction of the screen, for content-sized drawers. */
  maxHeightRatio?: number;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { onOpenChange } = DialogPrimitive.useRootContext();

  const translateY = useSharedValue(0);
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  /*
   * Drag-to-dismiss is bound to the grabber row rather than the whole panel.
   * A pan over the entire sheet would compete with the scrolling list inside it
   * for the same downward swipe; scoping it to the handle keeps both working
   * without any gesture-composition juggling.
   */
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      // Downward only -- dragging up must not lift the sheet off the edge.
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const dismissed =
        event.translationY > DRAG_CLOSE_DISTANCE || event.velocityY > DRAG_CLOSE_VELOCITY;
      if (dismissed) {
        // Hop back to the JS thread to flip the controlled `open` prop; the
        // exit animation then plays from wherever the drag left the panel.
        scheduleOnRN(close);
      } else {
        translateY.value = withSpring(0, SETTLE_SPRING);
      }
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  /*
   * Sized in pixels rather than with `h-[80%]`. A percentage height resolves
   * against the parent's height, and every ancestor here (the animated wrapper,
   * the KeyboardAvoidingView) is content-sized, so a percentage would resolve
   * against an indefinite value and collapse the drawer to its content.
   */
  const sizing = heightRatio
    ? { height: Math.round(height * heightRatio) }
    : { maxHeight: Math.round(height * maxHeightRatio) };

  return (
    <DrawerPortal hostName={portalHost}>
      <DrawerOverlay>
        {/* Bare Animated.View with no className: Reanimated owns this node's
            style, uniwind owns the panel's. Never both on one node. */}
        <Animated.View style={dragStyle}>
          {/* Android's windowSoftInputMode already resizes; iOS needs telling. */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <DialogPrimitive.Content
              className={cn(
                // No pb-* here: the inline paddingBottom below owns the bottom
                // edge so the home-indicator inset cannot be overridden by a class.
                'bg-background border-border z-50 w-full gap-4 rounded-t-2xl border-t px-5 pt-2 shadow-lg shadow-black/10',
                Platform.select({
                  web: 'animate-in slide-in-from-bottom mx-auto max-w-lg duration-200',
                }),
                className
              )}
              // Inline so the home-indicator inset is respected without a class
              // that a consumer's own padding could silently override.
              style={{ paddingBottom: insets.bottom + 12, ...sizing }}
              {...props}>
              <GestureDetector gesture={pan}>
                <DrawerHandle />
              </GestureDetector>
              <>{children}</>
              <DialogPrimitive.Close
                className={cn(
                  'absolute right-5 top-5 rounded opacity-70 active:opacity-100',
                  Platform.select({
                    web: 'ring-offset-background focus:ring-ring transition-opacity hover:opacity-100 focus:outline-none focus:ring-2',
                  })
                )}
                hitSlop={12}>
                <Icon
                  as={X}
                  className="text-muted-foreground web:pointer-events-none size-4 shrink-0"
                />
                <Text className="sr-only">Close</Text>
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </KeyboardAvoidingView>
        </Animated.View>
      </DrawerOverlay>
    </DrawerPortal>
  );
}

/**
 * The grabber bar, and the drag target for dismissing the drawer.
 *
 * Padded well beyond the visible 4pt bar so the touch area clears the ~44pt
 * minimum -- the bar is the affordance, not the hit box.
 *
 * `collapsable={false}` is required, not cosmetic: this View carries no props
 * that force a native node, so Android's view flattening would remove it and
 * leave the enclosing GestureDetector with nothing to attach the pan to.
 */
function DrawerHandle() {
  return (
    <View collapsable={false} className="items-center py-3">
      <View className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
    </View>
  );
}

function DrawerHeader({ className, ...props }: ViewProps) {
  return <View className={cn('gap-1 pr-8', className)} {...props} />;
}

function DrawerFooter({ className, ...props }: ViewProps) {
  return <View className={cn('flex-col-reverse gap-2', className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-foreground text-lg font-semibold leading-none', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
