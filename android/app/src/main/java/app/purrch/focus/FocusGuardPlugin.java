package app.purrch.focus;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FocusGuard")
public class FocusGuardPlugin extends Plugin {
    @PluginMethod public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", FocusGuardService.connected);
        call.resolve(result);
    }
    @PluginMethod public void openSettings(PluginCall call) {
        getActivity().startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        call.resolve();
    }
    @PluginMethod public void configure(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("focus_guard", 0);
        boolean active = Boolean.TRUE.equals(call.getBoolean("active", false));
        long endAt = call.getLong("endAt", 0L);
        if (endAt < 0) { call.reject("Invalid session deadline"); return; }
        boolean stored = prefs.edit().putBoolean("active", active).putLong("endAt", endAt)
            .putString("catName", call.getString("catName", "Miso")).commit();
        if (!stored) { call.reject("Could not save focus protection"); return; }
        call.resolve();
    }
    @PluginMethod public void exportBackup(PluginCall call) {
        String json = call.getString("json");
        if (json == null || json.length() > 10000000) { call.reject("Invalid backup"); return; }
        share(call, "purrch-backup.json", "application/json", json.getBytes(StandardCharsets.UTF_8));
    }
    @PluginMethod public void exportImage(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.length() > 20000000) { call.reject("Invalid image"); return; }
        try { share(call, "purrch-room.png", "image/png", Base64.decode(data, Base64.DEFAULT)); }
        catch (IllegalArgumentException e) { call.reject("Could not decode image"); }
    }
    private void share(PluginCall call, String name, String type, byte[] data) {
        try {
            File directory = new File(getContext().getCacheDir(), "shared");
            if (!directory.exists() && !directory.mkdirs()) { call.reject("Could not create export"); return; }
            File file = new File(directory, name);
            try (FileOutputStream stream = new FileOutputStream(file)) { stream.write(data); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName()+".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_SEND).setType(type)
                .putExtra(Intent.EXTRA_STREAM, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(intent, "Save your little corner"));
            call.resolve();
        } catch (Exception e) { call.reject("Could not export file", e); }
    }
}
