package com.secondthought.spending;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.app.Activity;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.OutputStream;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "SpendingGuard")
public class SpendingGuardPlugin extends Plugin {
  static final String PREFS = "spending_guard";
  @PluginMethod public void configure(PluginCall call) {
    JSArray packages = call.getArray("packages", new JSArray());
    boolean consent = Boolean.TRUE.equals(call.getBoolean("consent", false));
    boolean enabled = Boolean.TRUE.equals(call.getBoolean("protection", false)) && consent;
    int minutes = call.getInt("durationMinutes", 10);
    android.content.SharedPreferences.Editor editor = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
    if (!enabled) editor.clear();
    editor.putString("packages", packages.toString()).putBoolean("protection", enabled).putBoolean("consent", consent)
      .putInt("duration", Math.max(1, Math.min(1440, minutes)))
      .putString("goal", call.getString("goal", "Your goal"))
      .putString("amount", call.getString("protectedAmount", "$0.00")).apply();
    call.resolve();
  }
  @PluginMethod public void status(PluginCall call) {
    AccessibilityManager manager = (AccessibilityManager) getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
    boolean on = false;
    for (AccessibilityServiceInfo info : manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)) {
      if (info.getResolveInfo().serviceInfo.packageName.equals(getContext().getPackageName()) && info.getResolveInfo().serviceInfo.name.equals(ShoppingAccessibilityService.class.getName())) on = true;
    }
    JSObject result = new JSObject(); result.put("enabled", on); call.resolve(result);
  }
  @PluginMethod public void openAccessibilitySettings(PluginCall call) {
    if (!getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("consent", false)) { call.reject("App protection consent required"); return; }
    Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent); call.resolve();
  }
  @PluginMethod public void exportData(PluginCall call) {
    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("application/json");
    intent.putExtra(Intent.EXTRA_TITLE, "second-thought-spending.json");
    startActivityForResult(call, intent, "exportResult");
  }
  @ActivityCallback private void exportResult(PluginCall call, ActivityResult result) {
    JSObject response = new JSObject();
    if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) { response.put("saved", false); call.resolve(response); return; }
    try (OutputStream stream = getContext().getContentResolver().openOutputStream(result.getData().getData())) {
      if (stream == null) throw new Exception("No output stream");
      stream.write(call.getString("content", "{}").getBytes(java.nio.charset.StandardCharsets.UTF_8));
      response.put("saved", true); call.resolve(response);
    } catch (Exception e) { call.reject("Could not export data", e); }
  }
  @PluginMethod public void listApps(PluginCall call) {
    PackageManager pm = getContext().getPackageManager();
    Intent launcher = new Intent(Intent.ACTION_MAIN); launcher.addCategory(Intent.CATEGORY_LAUNCHER);
    List<ResolveInfo> matches = pm.queryIntentActivities(launcher, 0);
    List<JSObject> results = new ArrayList<>(); Set<String> seen = new HashSet<>();
    for (ResolveInfo info : matches) {
      String pkg = info.activityInfo.packageName;
      if (pkg.equals(getContext().getPackageName()) || !seen.add(pkg)) continue;
      JSObject app = new JSObject(); app.put("packageName", pkg); app.put("label", info.loadLabel(pm).toString()); results.add(app);
    }
    Collections.sort(results, Comparator.comparing(o -> o.getString("label").toLowerCase()));
    JSObject out = new JSObject(); out.put("apps", new JSArray(results)); call.resolve(out);
  }
}
