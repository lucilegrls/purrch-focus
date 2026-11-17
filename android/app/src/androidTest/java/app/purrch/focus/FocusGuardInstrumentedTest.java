package app.purrch.focus;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.app.UiAutomation;
import android.os.SystemClock;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.Configurator;
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
  Configurator.getInstance().setUiAutomationFlags(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
  UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
  SharedPreferences prefs=context.getSharedPreferences("focus_guard",0);
  try {
   device.wakeUp();device.executeShellCommand("wm dismiss-keyguard");
   context.startActivity(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
   assertTrue("Native WebView must render the focus screen",device.wait(Until.hasObject(By.textContains("A little focus")),15000));
   device.executeShellCommand("settings put secure enabled_accessibility_services app.purrch.focus/app.purrch.focus.FocusGuardService");
   device.executeShellCommand("settings put secure accessibility_enabled 1");
   long limit=SystemClock.elapsedRealtime()+15000;
   while(!FocusGuardService.connected&&SystemClock.elapsedRealtime()<limit) SystemClock.sleep(100);
   assertTrue("Accessibility service must connect",FocusGuardService.connected);
   // Exercise the real WebView -> Capacitor -> native preferences path, not only the policy.
   assertNotNull("Start control must be available",device.wait(Until.findObject(By.text("Let’s focus")),10000));
   device.waitForIdle();
   device.takeScreenshot(new File(context.getExternalFilesDir(null),"purrch-android.png"));
   device.findObject(By.text("Let’s focus")).click();
   limit=SystemClock.elapsedRealtime()+10000;
   while(!prefs.getBoolean("active",false)&&SystemClock.elapsedRealtime()<limit) SystemClock.sleep(100);
   assertTrue("Starting in the app must enable native protection",prefs.getBoolean("active",false));
   assertTrue("The app must save a future countdown deadline",prefs.getLong("endAt",0)>System.currentTimeMillis());
   assertNotNull(device.wait(Until.findObject(By.text("Pause")),5000));
   device.findObject(By.text("Pause")).click();
   limit=SystemClock.elapsedRealtime()+5000;
   while(prefs.getLong("endAt",-1)!=0&&SystemClock.elapsedRealtime()<limit) SystemClock.sleep(100);
   assertTrue("Pausing in the app must retain protection",prefs.getBoolean("active",false));
   assertEquals("Paused protection must have no deadline",0,prefs.getLong("endAt",-1));
   device.findObject(By.text("End")).click();
   assertNotNull(device.wait(Until.findObject(By.text("End session")),5000));
   device.findObject(By.text("End session")).click();
   limit=SystemClock.elapsedRealtime()+5000;
   while(prefs.getBoolean("active",true)&&SystemClock.elapsedRealtime()<limit) SystemClock.sleep(100);
   assertFalse("Ending in the app must disable native protection",prefs.getBoolean("active",true));
   assertNotNull(device.wait(Until.findObject(By.text("Back to your nook")),5000));
   device.findObject(By.text("Back to your nook")).click();
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
