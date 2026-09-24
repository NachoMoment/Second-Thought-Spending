package com.secondthought.spending;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class ShoppingPauseActivity extends Activity {
  private String target;
  private int teal = Color.rgb(32, 88, 94);
  private int dp(float size) { return (int)(size * getResources().getDisplayMetrics().density + .5f); }
  private GradientDrawable bg(int color, int radius) { GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(radius)); return d; }
  private TextView text(String value, int size, boolean bold) { TextView t = new TextView(this); t.setText(value); t.setTextSize(size); t.setTextColor(teal); if (bold) t.setTypeface(null, Typeface.BOLD); return t; }
  private void button(LinearLayout layout, String title, boolean primary, View.OnClickListener action) {
    Button b = new Button(this); b.setText(title); b.setAllCaps(false); b.setTextSize(16); b.setTextColor(primary ? Color.WHITE : teal); b.setBackground(bg(primary ? teal : Color.WHITE, 14));
    LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, dp(56)); p.topMargin = dp(10); layout.addView(b,p); b.setOnClickListener(action);
  }
  @Override public void onCreate(Bundle state) { super.onCreate(state); show(); }
  @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); show(); }
  private void show() {
    target = getIntent().getStringExtra("package");
    if (target == null) { finish(); return; }
    SharedPreferences prefs = getSharedPreferences(SpendingGuardPlugin.PREFS, Context.MODE_PRIVATE);
    getWindow().setStatusBarColor(Color.rgb(247, 248, 241)); getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(dp(26),dp(35),dp(26),dp(20)); root.setBackgroundColor(Color.rgb(251,250,245));
    TextView brand = text("✳  SECOND THOUGHT  /  SPENDING", 12, true); root.addView(brand);
    TextView heading = text("Take a moment.", 32, true); LinearLayout.LayoutParams hp = new LinearLayout.LayoutParams(-1,-2); hp.topMargin = dp(34); root.addView(heading,hp);
    TextView bubble = text("pause  ·  notice  ·  choose", 17, false); bubble.setGravity(Gravity.CENTER); bubble.setBackground(bg(Color.rgb(220,236,226),100)); LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(dp(205),dp(205)); bp.gravity = Gravity.CENTER_HORIZONTAL; bp.topMargin = dp(30); bp.bottomMargin = dp(25); root.addView(bubble,bp);
    bubble.animate().scaleX(1.12f).scaleY(1.12f).setDuration(2000).withEndAction(() -> bubble.animate().scaleX(1f).scaleY(1f).setDuration(2000));
    TextView goal = text("Protecting: " + prefs.getString("goal","Your goal") + "\nMoney protected: " + prefs.getString("amount","$0.00"), 17, true); goal.setLineSpacing(dp(6),1); root.addView(goal);
    TextView note = text("You can leave, add an item to cool down, or continue shopping for a while. Your choice.", 15, false); LinearLayout.LayoutParams np = new LinearLayout.LayoutParams(-1,-2); np.topMargin = dp(14); np.bottomMargin = dp(14); root.addView(note,np);
    button(root,"Leave shopping app",true,v -> { Intent home = new Intent(Intent.ACTION_MAIN); home.addCategory(Intent.CATEGORY_HOME); home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(home); finish(); });
    button(root,"Add item to cooling-off list",false,v -> { Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse("secondthought-spending://add-item")); open.setPackage(getPackageName()); open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP); startActivity(open); finish(); });
    button(root,"Open temporarily",false,v -> { int minutes = prefs.getInt("duration",10); prefs.edit().putLong("allow_" + target,System.currentTimeMillis() + minutes * 60000L).apply(); Intent launch = getPackageManager().getLaunchIntentForPackage(target); if (launch != null) { launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT); startActivity(launch); } finish(); });
    button(root,"Turn off protection",false,v -> { prefs.edit().putBoolean("protection",false).putBoolean("consent",false).apply(); Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse("secondthought-spending://protection-off")); open.setPackage(getPackageName()); open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP); startActivity(open); finish(); });
    TextView footer = text("Protection can also be disabled in Android Accessibility settings.",12,false); LinearLayout.LayoutParams fp = new LinearLayout.LayoutParams(-1,-2); fp.topMargin = dp(20); root.addView(footer,fp);
    android.widget.ScrollView scroll = new android.widget.ScrollView(this); scroll.setFillViewport(true); scroll.addView(root); setContentView(scroll);
  }
}
