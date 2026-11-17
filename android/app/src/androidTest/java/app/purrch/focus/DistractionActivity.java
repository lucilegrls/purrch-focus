package app.purrch.focus;
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class DistractionActivity extends Activity {
 @Override public void onCreate(Bundle state) {super.onCreate(state);TextView t=new TextView(this);t.setText("A distracting app for testing");t.setTextSize(24);setContentView(t);}
}
