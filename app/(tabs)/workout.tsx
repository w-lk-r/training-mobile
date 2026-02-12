import { observer } from "@legendapp/state/react";
import { activeSessionId$ } from "../../utils/supabase";
import { useActiveSessionDayIds, useActiveAdHocExerciseIds } from "../../hooks/use-workout-session";
import WorkoutComposerScreen from "../../components/screens/WorkoutComposerScreen";
import WorkoutScreen from "../../components/screens/WorkoutScreen";

const WorkoutTab = observer(() => {
  const sessionId = activeSessionId$.get();
  const dayIds = useActiveSessionDayIds();
  const adHocExerciseIds = useActiveAdHocExerciseIds();

  if (sessionId) {
    return <WorkoutScreen dayIds={dayIds} adHocExerciseIds={adHocExerciseIds} />;
  }

  return <WorkoutComposerScreen />;
});

export default WorkoutTab;
