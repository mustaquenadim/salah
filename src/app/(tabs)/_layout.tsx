import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';

import { FloatingTabBar, FloatingTabBarButton, TABS } from '@/components/floating-tab-bar';
import { MeshGradientBackground } from '@/components/mesh-gradient-background';
import { PrayerAlerts } from '@/components/prayer-alerts';

/**
 * Headless tabs, so the bar is ours to draw. `TabSlot` fills the screen and the
 * bar floats over it -- screens that scroll should pad their content by
 * `TAB_BAR_SPACE` so the last item clears the pill.
 *
 * The `TabTrigger` elements must stay direct children of `FloatingTabBar`:
 * expo-router walks one level past `<TabList asChild>` to discover the routes,
 * so wrapping them in another view would drop the tabs.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      {/* First child, so every screen paints over it. Tabs ignores children
          that are not a TabList or TabTrigger when it collects routes. */}
      <MeshGradientBackground />
      <TabSlot />
      {/* After TabSlot so the adhan banner floats over the screens, before the
          TabList so the bar stays on top of it. */}
      <PrayerAlerts />
      <TabList asChild>
        <FloatingTabBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <FloatingTabBarButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}
