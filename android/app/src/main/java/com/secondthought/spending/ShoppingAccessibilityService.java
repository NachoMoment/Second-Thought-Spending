package com.secondthought.spending;
import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import org.json.JSONArray;

public class ShoppingAccessibilityService extends AccessibilityService {
  private long lastLaunch = 0;
  @Override public void onAccessibilityEvent(AccessibilityEvent event) {
    if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || event.getPackageName() == null) return;
    String pkg = event.getPackageName().toString();
    if (pkg.equals(getPackageName()) || pkg.equals("com.android.systemui")) return;
    SharedPreferences prefs = getSharedPreferences(SpendingGuardPlugin.PREFS, Context.MODE_PRIVATE);
    if (!prefs.getBoolean("protection", false)) return;
    try {
      JSONArray list = new JSONArray(prefs.getString("packages", "[]"));
      boolean selected = false;
      for (int i = 0; i < list.length(); i++) if (pkg.equals(list.optString(i))) { selected = true; break; }
      if (!selected || System.currentTimeMillis() < prefs.getLong("allow_" + pkg, 0)) return;
      long now = SystemClock.elapsedRealtime();
      if (now - lastLaunch < 2500) return;
      lastLaunch = now;
      Intent pause = new Intent(this, ShoppingPauseActivity.class);
      pause.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
      pause.putExtra("package", pkg);
      startActivity(pause);
    } catch (Exception ignored) { }
  }
  @Override public void onInterrupt() { }
}
