package app.purrch.focus;

import java.util.Set;

/** Pure policy, independent of Android. The service never inspects screen contents. */
public final class FocusPolicy {
    private FocusPolicy() {}
    public static boolean active(boolean enabled, long endAt, long now) {
        return enabled && (endAt == 0 || now < endAt);
    }
    public static boolean shouldBlock(String foreground, String ownPackage, Set<String> essentials) {
        return foreground != null && !foreground.isEmpty() && !foreground.equals(ownPackage)
            && !essentials.contains(foreground);
    }
}
