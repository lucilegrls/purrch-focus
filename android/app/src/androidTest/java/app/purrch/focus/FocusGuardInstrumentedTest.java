package app.purrch.focus;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.Until;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class FocusGuardInstrumentedTest {
 @Test public void realAccessibilityOverlayBlocksAndReleases() throws Exception {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
  UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
  SharedPreferences prefs=context.getSharedPreferences("focus_guard",0);
  try {
   device.wakeUp();device.executeShellCommand("wm dismiss-keyguard");
   context.startActivity(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
   assertTrue("Native WebView must render the focus screen",device.wait(Until.hasObject(By.textContains("A little focus")),15000));
   device.takeScreenshot(new File(context.getExternalFilesDir(null),"purrch-android.png"));
   device.executeShellCommand("settings put secure enabled_accessibility_services app.purrch.focus/app.purrch.focus.FocusGuardService");
   device.executeShellCommand("settings put secure accessibility_enabled 1");
   long limit=SystemClock.elapsedRealtime()+15000;
   while(!FocusGuardService.connected&&SystemClock.elapsedRealtime()<limit) SystemClock.sleep(100);
   assertTrue("Accessibility service must connect",FocusGuardService.connected);
   Intent distraction=new Intent().setComponent(new ComponentName("app.purrch.focus.test","app.purrch.focus.DistractionActivity")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
   prefs.edit().putBoolean("active",true).putLong("endAt",System.currentTimeMillis()+8000).commit();
   context.startActivity(distraction);
   assertTrue("Other apps must be covered",device.wait(Until.hasObject(By.text("Back to my cat")),5000));
   device.takeScreenshot(new File(context.getExternalFilesDir(null),"purrch-blocker.png"));
   device.pressHome();
   assertTrue("Home must remain accessible",device.wait(Until.gone(By.text("Back to my cat")),3000));
   context.startActivity(distraction);
   assertTrue("Reopening an app must block it again",device.wait(Until.hasObject(By.text("Back to my cat")),3000));
   assertTrue("Protection must release without reopening Purrch",device.wait(Until.gone(By.text("Back to my cat")),10000));
   prefs.edit().putBoolean("active",true).putLong("endAt",0).commit();
   assertTrue("Paused and count-up sessions must remain protected",device.wait(Until.hasObject(By.text("Back to my cat")),3000));
   prefs.edit().putBoolean("active",false).commit();
   assertTrue("Ending a session must release the overlay",device.wait(Until.gone(By.text("Back to my cat")),3000));
  } finally {prefs.edit().putBoolean("active",false).commit();device.executeShellCommand("settings delete secure enabled_accessibility_services");device.executeShellCommand("settings put secure accessibility_enabled 0");}
 }
}
