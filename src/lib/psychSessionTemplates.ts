export interface SessionTemplate {
  id: string;
  name: string;
  type: 'CBT' | 'Supportive' | 'Crisis';
  description: string;
  sections: TemplateSection[];
}

export interface TemplateSection {
  title: string;
  defaultContent: string;
}

export interface TextSnippet {
  id: string;
  shortcut: string;
  label: string;
  text: string;
  category: string;
}

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'cbt-standard',
    name: 'CBT Standard Session',
    type: 'CBT',
    description: 'Cognitive Behavioral Therapy – standard session structure',
    sections: [
      { title: 'Mood Check-in', defaultContent: 'Current mood (0-10): \nAnxiety level (0-10): \nSleep quality: \nAppetite changes: ' },
      { title: 'Homework Review', defaultContent: 'Previous homework assigned: \nCompletion status: \nDifficulties encountered: \nInsights gained: ' },
      { title: 'Agenda Setting', defaultContent: 'Topics to cover today:\n1. \n2. \n3. ' },
      { title: 'Automatic Thoughts Identification', defaultContent: 'Situation: \nAutomatic thought: \nEmotion: \nIntensity (0-100%): \nEvidence for: \nEvidence against: \nBalanced thought: \nNew emotion intensity (0-100%): ' },
      { title: 'Cognitive Distortions', defaultContent: 'Identified distortions:\n☐ All-or-nothing thinking\n☐ Overgeneralization\n☐ Mental filter\n☐ Catastrophizing\n☐ Mind reading\n☐ Fortune telling\n☐ Personalization\n☐ Should statements\n☐ Emotional reasoning\n☐ Labeling' },
      { title: 'Behavioral Experiments', defaultContent: 'Prediction: \nExperiment: \nOutcome: \nLearning: ' },
      { title: 'Homework Assignment', defaultContent: 'New homework:\n1. Thought record (minimum 3 entries)\n2. \nDue date: ' },
      { title: 'Session Summary', defaultContent: 'Key takeaways:\n1. \n2. \nNext session date: ' },
    ],
  },
  {
    id: 'supportive-standard',
    name: 'Supportive Therapy Session',
    type: 'Supportive',
    description: 'Supportive counseling – empathic listening and coping',
    sections: [
      { title: 'Check-in & Rapport', defaultContent: 'General presentation: \nAppearance: \nMood/Affect: \nRecent events: ' },
      { title: 'Current Concerns', defaultContent: 'Primary concern today: \nDuration: \nImpact on daily functioning: \nCoping strategies used: ' },
      { title: 'Emotional Processing', defaultContent: 'Emotions expressed: \nEmotional awareness level: \nValidation provided: \nReflections: ' },
      { title: 'Strengths & Resources', defaultContent: 'Identified strengths:\n- \nSupport system:\n- \nPositive developments since last session: ' },
      { title: 'Coping Strategies Discussed', defaultContent: 'Strategies reviewed:\n☐ Deep breathing\n☐ Progressive muscle relaxation\n☐ Journaling\n☐ Social support activation\n☐ Physical activity\n☐ Mindfulness\n☐ Other: ' },
      { title: 'Goals & Action Steps', defaultContent: 'Short-term goals:\n1. \nAction steps for next week:\n1. \nBarriers anticipated: ' },
      { title: 'Session Notes', defaultContent: 'Clinical observations: \nTherapeutic alliance: \nProgress indicators: \nNext session focus: ' },
    ],
  },
  {
    id: 'crisis-intervention',
    name: 'Crisis Intervention Session',
    type: 'Crisis',
    description: 'Crisis intervention – safety assessment and stabilization',
    sections: [
      { title: 'Crisis Assessment', defaultContent: 'Nature of crisis: \nOnset: \nPrecipitating event: \nSeverity (1-10): ' },
      { title: 'Safety Assessment', defaultContent: 'Suicidal ideation: ☐ Yes ☐ No\nPlan: ☐ Yes ☐ No\nMeans: ☐ Yes ☐ No\nIntent: ☐ Yes ☐ No\nPrevious attempts: ☐ Yes ☐ No\nSelf-harm: ☐ Yes ☐ No\nHomicidal ideation: ☐ Yes ☐ No\nRisk level: ☐ Low ☐ Medium ☐ High ☐ Imminent' },
      { title: 'Protective Factors', defaultContent: 'Reasons for living: \nSupport network: \nFuture plans: \nReligious/spiritual beliefs: \nChildren/family responsibilities: \nFear of death/pain: ' },
      { title: 'Stabilization Interventions', defaultContent: 'Interventions used:\n☐ De-escalation\n☐ Grounding techniques\n☐ Safety planning\n☐ Breathing exercises\n☐ Crisis hotline information provided\n☐ Emergency contacts notified\n☐ Referral to emergency services\nResponse to interventions: ' },
      { title: 'Safety Plan', defaultContent: '1. Warning signs:\n2. Internal coping strategies:\n3. People to contact for distraction:\n4. People to ask for help:\n5. Professionals/agencies to contact:\n   - Emergency: 911\n   - Crisis Line: \n6. Making the environment safe: ' },
      { title: 'Follow-up Plan', defaultContent: 'Next appointment: \nFrequency of check-ins: \nEmergency contact notified: ☐ Yes ☐ No\nReferred to: \nMedication review needed: ☐ Yes ☐ No' },
      { title: 'Documentation', defaultContent: 'Clinical decision rationale: \nConsultation obtained: ☐ Yes ☐ No\nSupervisor notified: ☐ Yes ☐ No\nRisk level at end of session: ' },
    ],
  },
];

export const TEXT_SNIPPETS: TextSnippet[] = [
  // Assessment snippets
  { id: 's1', shortcut: '/mse', label: 'Mental Status Exam', category: 'Assessment', text: 'Appearance: Well-groomed, appropriate dress\nBehavior: Cooperative, good eye contact\nSpeech: Normal rate, rhythm, and volume\nMood: \nAffect: Congruent with mood\nThought Process: Linear, goal-directed\nThought Content: No SI/HI, no delusions\nPerception: No hallucinations reported\nCognition: Alert, oriented x4\nInsight: \nJudgment: ' },
  { id: 's2', shortcut: '/risk', label: 'Risk Assessment', category: 'Assessment', text: 'Suicidal Ideation: Denied\nHomicidal Ideation: Denied\nSelf-harm: Denied\nSubstance use: \nRisk factors: \nProtective factors: \nOverall risk level: Low\nSafety plan reviewed: Yes' },
  { id: 's3', shortcut: '/phq', label: 'PHQ-9 Results', category: 'Assessment', text: 'PHQ-9 Score: /27\nSeverity: ☐ Minimal (0-4) ☐ Mild (5-9) ☐ Moderate (10-14) ☐ Moderately Severe (15-19) ☐ Severe (20-27)\nChange from last administration: \nItem 9 (SI): ' },
  { id: 's4', shortcut: '/gad', label: 'GAD-7 Results', category: 'Assessment', text: 'GAD-7 Score: /21\nSeverity: ☐ Minimal (0-4) ☐ Mild (5-9) ☐ Moderate (10-14) ☐ Severe (15-21)\nChange from last administration: ' },
  
  // Progress snippets
  { id: 's5', shortcut: '/prog', label: 'Progress Note', category: 'Progress', text: 'Client reports improvement in [area]. Symptom severity has [decreased/increased/remained stable]. Client is [engaged/partially engaged] in treatment. Treatment goals are being [met/partially met/not met].' },
  { id: 's6', shortcut: '/stable', label: 'Stable Presentation', category: 'Progress', text: 'Client presents with stable mood and affect. No significant changes since last session. Continues to utilize coping strategies discussed. Denies SI/HI. Sleep and appetite within normal limits.' },
  
  // Intervention snippets
  { id: 's7', shortcut: '/cbt-int', label: 'CBT Interventions', category: 'Interventions', text: 'Interventions used: Cognitive restructuring, behavioral activation, thought record review. Client practiced identifying automatic thoughts and generating balanced alternatives.' },
  { id: 's8', shortcut: '/relax', label: 'Relaxation Training', category: 'Interventions', text: 'Taught progressive muscle relaxation (PMR) technique. Client practiced in session with positive response. Assigned daily practice for homework. Provided audio guide resource.' },
  { id: 's9', shortcut: '/ground', label: 'Grounding Techniques', category: 'Interventions', text: 'Reviewed 5-4-3-2-1 grounding technique:\n- 5 things you can see\n- 4 things you can touch\n- 3 things you can hear\n- 2 things you can smell\n- 1 thing you can taste\nClient demonstrated understanding and successful application in session.' },
  
  // Plan snippets
  { id: 's10', shortcut: '/plan', label: 'Treatment Plan Update', category: 'Plan', text: 'Continue current treatment approach. Next session scheduled for [date]. Homework: [describe]. Goals for next session: [describe]. No medication changes recommended at this time.' },
  { id: 's11', shortcut: '/refer', label: 'Referral Note', category: 'Plan', text: 'Referral made to [provider/service] for [reason]. Client consented to referral. Contact information provided. Follow-up scheduled to ensure connection with referred service.' },
  { id: 's12', shortcut: '/discharge', label: 'Discharge Summary', category: 'Plan', text: 'Treatment goals: [met/partially met]\nTotal sessions: \nPresenting concerns addressed: \nProgress summary: \nRelapse prevention plan: \nFollow-up recommendations: \nClient feedback on treatment: ' },
];

export function exportSessionsToJSON(sessions: any[]): string {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalSessions: sessions.length,
    sessions: sessions.map(s => ({
      ...s,
      // Strip any internal IDs for privacy
      id: undefined,
      profile_id: undefined,
      created_by: undefined,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadLocalFile(content: string, filename: string, type: string = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
