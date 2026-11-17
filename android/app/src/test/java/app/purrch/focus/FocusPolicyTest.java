package app.purrch.focus;
import org.junit.Test;
import java.util.Set;
import static org.junit.Assert.*;
public class FocusPolicyTest {
 @Test public void releasesExactlyAtDeadline(){assertTrue(FocusPolicy.active(true,200,199));assertFalse(FocusPolicy.active(true,200,200));}
 @Test public void inactiveNeverBlocks(){assertFalse(FocusPolicy.active(false,0,200));}
 @Test public void countupAndPausedRemainProtected(){assertTrue(FocusPolicy.active(true,0,999999));}
 @Test public void blocksAnyOtherApp(){assertTrue(FocusPolicy.shouldBlock("com.example.distraction","app.purrch.focus",Set.of("phone")));}
 @Test public void preservesEssentialsAndOwnApp(){assertFalse(FocusPolicy.shouldBlock("phone","app.purrch.focus",Set.of("phone")));assertFalse(FocusPolicy.shouldBlock("app.purrch.focus","app.purrch.focus",Set.of("phone")));assertFalse(FocusPolicy.shouldBlock(null,"app.purrch.focus",Set.of("phone")));}
}
