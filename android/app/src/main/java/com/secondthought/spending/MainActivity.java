package com.secondthought.spending;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle state) {
    registerPlugin(SpendingGuardPlugin.class);
    super.onCreate(state);
  }
}
