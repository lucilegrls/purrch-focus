package app.purrch.focus;

import android.accessibilityservice.AccessibilityService;
import android.app.KeyguardManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.telecom.TelecomManager;
import android.view.Gravity;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** A user-enabled focus aid. No device-admin, content capture, usage logs, or network. */
public class FocusGuardService extends AccessibilityService implements SharedPreferences.OnSharedPreferenceChangeListener {
    public static volatile boolean connected = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Set<String> essentials = new HashSet<>();
    private SharedPreferences prefs;
    private WindowManager windowManager;
    private LinearLayout overlay;
    private TextView timeLabel;
    private String foreground;
    private String keyboardPackage;
    private final Runnable ticker = new Runnable() {
        @Override public void run() { refresh(); handler.postDelayed(this, 500); }
    };

    @Override protected void onServiceConnected() {
        connected = true;
        prefs = getSharedPreferences("focus_guard", MODE_PRIVATE);
        prefs.registerOnSharedPreferenceChangeListener(this);
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        essentials.addAll(Arrays.asList("android", "com.android.systemui", "com.android.settings",
            "com.android.phone", "com.android.server.telecom", "com.android.emergency",
            "com.android.dialer", "com.google.android.dialer", "com.android.incallui",
            "com.samsung.android.incallui", "com.samsung.android.dialer",
            "com.android.permissioncontroller", "com.google.android.permissioncontroller"));
        addHandler(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME));
        addHandler(new Intent(Settings.ACTION_SETTINGS));
        TelecomManager telecom = (TelecomManager) getSystemService(TELECOM_SERVICE);
        if (telecom != null && telecom.getDefaultDialerPackage() != null) essentials.add(telecom.getDefaultDialerPackage());
        refreshKeyboard();
        handler.post(ticker);
    }
    private void addHandler(Intent intent) {
        ResolveInfo info = getPackageManager().resolveActivity(intent, 0);
        if (info != null && info.activityInfo != null) essentials.add(info.activityInfo.packageName);
    }
    private void refreshKeyboard() {
        String ime = Settings.Secure.getString(getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
        ComponentName component = ime == null ? null : ComponentName.unflattenFromString(ime);
        keyboardPackage = component == null ? null : component.getPackageName();
    }
    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if (prefs == null || event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence packageName = event.getPackageName();
        if (packageName == null) return;
        String pkg = packageName.toString();
        // Ignore our own overlay events so they do not remove the blocking window.
        String cls = String.valueOf(event.getClassName());
        if (pkg.equals(getPackageName()) && overlay != null && !cls.equals(MainActivity.class.getName())) return;
        refreshKeyboard();
        if (pkg.equals(keyboardPackage)) return; // An IME must not dismiss an existing block.
        foreground = pkg;
        refresh();
    }
    private boolean isActive() {
        return FocusPolicy.active(prefs.getBoolean("active", false), prefs.getLong("endAt", 0), System.currentTimeMillis());
    }
    private void refresh() {
        if (prefs == null) return;
        KeyguardManager keyguard = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        if (!isActive() || (keyguard != null && keyguard.isKeyguardLocked()) || !FocusPolicy.shouldBlock(foreground, getPackageName(), essentials)) {
            hideOverlay(); return;
        }
        if (overlay == null) showOverlay();
        if (timeLabel != null) {
            long end = prefs.getLong("endAt", 0);
            if (end == 0) timeLabel.setText("Your focus session is still open");
            else {
                long seconds = Math.max(0, (end-System.currentTimeMillis()+999)/1000);
                timeLabel.setText(String.format(java.util.Locale.US, "%02d:%02d left in your little moment", seconds/60, seconds%60));
            }
        }
    }
    private TextView text(String value, int size, int color) {
        TextView view = new TextView(this);
        view.setText(value); view.setTextSize(size); view.setTextColor(color);
        view.setGravity(Gravity.CENTER); view.setPadding(0, 14, 0, 14);
        return view;
    }
    private void showOverlay() {
        overlay = new LinearLayout(this);
        overlay.setOrientation(LinearLayout.VERTICAL); overlay.setGravity(Gravity.CENTER);
        overlay.setPadding(38, 60, 38, 60); overlay.setBackgroundColor(Color.rgb(250,248,243));
        overlay.setImportantForAccessibility(android.view.View.IMPORTANT_FOR_ACCESSIBILITY_YES);
        overlay.addView(text("🐈", 72, Color.rgb(126,142,105)));
        TextView title = text("Your little moment matters.", 28, Color.rgb(72,91,61));
        title.setTypeface(Typeface.create("serif", Typeface.NORMAL)); overlay.addView(title);
        overlay.addView(text(prefs.getString("catName", "Miso") + " is saving your seat.\nThis app can wait a little.", 17, Color.rgb(119,129,105)));
        timeLabel = text("", 16, Color.rgb(119,129,105)); overlay.addView(timeLabel);
        Button back = new Button(this); back.setText("Back to my cat"); back.setAllCaps(false);
        back.setTextColor(Color.WHITE); back.setTextSize(16);
        GradientDrawable background = new GradientDrawable(); background.setColor(Color.rgb(109,130,87)); background.setCornerRadius(30); back.setBackground(background);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 64*getResources().getDisplayMetrics().densityDpi/160);
        params.setMargins(10, 25, 10, 15); overlay.addView(back, params);
        back.setOnClickListener(v -> {
            foreground = getPackageName(); hideOverlay();
            startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP));
        });
        overlay.addView(text("Phone calls and essential Android controls remain available.", 12, Color.rgb(145,150,132)));
        WindowManager.LayoutParams layout = new WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.OPAQUE);
        layout.gravity = Gravity.TOP;
        try { windowManager.addView(overlay, layout); }
        catch (RuntimeException e) { overlay = null; timeLabel = null; }
    }
    private void hideOverlay() {
        if (overlay != null) { try { windowManager.removeView(overlay); } catch (IllegalArgumentException ignored) {} }
        overlay = null; timeLabel = null;
    }
    @Override public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) { handler.post(this::refresh); }
    @Override public void onInterrupt() { hideOverlay(); }
    @Override public void onDestroy() {
        connected = false; handler.removeCallbacksAndMessages(null); hideOverlay();
        if (prefs != null) prefs.unregisterOnSharedPreferenceChangeListener(this);
        super.onDestroy();
    }
}
