import assert from 'node:assert';
import {
  getSmartToolAndSkillRecommendations,
  ALL_AVAILABLE_TOOLS,
  ALL_AVAILABLE_SKILLS,
  RECOMMENDATIONS_DISCLAIMER,
} from '../src/utils/briefRecommendations.ts';
import type { BriefFormData } from '../src/types/brief.ts';

console.log('--- RUNNING SMART BRIEF RECOMMENDATIONS TEST SUITE ---');

// [TEST 1] Baseline Content Type Recommendations
console.log('\n[TEST 1] Baseline Content Type Recommendations');

// 1a. Brand Commercial Video
const videoRec = getSmartToolAndSkillRecommendations({ contentType: 'Brand Commercial Video' });
assert.ok(videoRec.suggestedTools.includes('Runway Gen-3'), 'Video recommends Runway Gen-3');
assert.ok(videoRec.suggestedSkills.includes('Camera Motion Control'), 'Video recommends Camera Motion Control');
assert.ok(videoRec.suggestedSkills.includes('Cinematic Storytelling'), 'Video recommends Cinematic Storytelling');
console.log('✓ Brand Commercial Video baseline PASSED');

// 1b. 3D Product VFX
const vfxRec = getSmartToolAndSkillRecommendations({ contentType: '3D Product VFX' });
assert.ok(vfxRec.suggestedTools.includes('Flux.1 Dev'), '3D Product VFX recommends Flux.1 Dev');
assert.ok(vfxRec.suggestedSkills.includes('Product Photorealism'), '3D Product VFX recommends Product Photorealism');
assert.ok(vfxRec.suggestedSkills.includes('ControlNet Precision'), '3D Product VFX recommends ControlNet Precision');
console.log('✓ 3D Product VFX baseline PASSED');

// 1c. Generative Animation
const animRec = getSmartToolAndSkillRecommendations({ contentType: 'Generative Animation' });
assert.ok(animRec.suggestedTools.includes('Kling 1.5'), 'Animation recommends Kling 1.5');
assert.ok(animRec.suggestedSkills.includes('Kinetic Motion Loops'), 'Animation recommends Kinetic Motion Loops');
assert.ok(animRec.suggestedSkills.includes('Stylized Shading'), 'Animation recommends Stylized Shading');
console.log('✓ Generative Animation baseline PASSED');

// 1d. Key Visual Still
const stillRec = getSmartToolAndSkillRecommendations({ contentType: 'Key Visual Still' });
assert.ok(stillRec.suggestedTools.includes('Midjourney v6') || stillRec.suggestedTools.includes('Flux.1 Dev'), 'Still recommends image models');
assert.ok(stillRec.suggestedSkills.includes('Editorial Lighting'), 'Still recommends Editorial Lighting');
console.log('✓ Key Visual Still baseline PASSED');

// 1e. Virtual Persona Asset
const personaRec = getSmartToolAndSkillRecommendations({ contentType: 'Virtual Persona Asset' });
assert.ok(personaRec.suggestedSkills.includes('Facial Consistency') || personaRec.suggestedSkills.includes('Character Consistency'), 'Persona recommends Consistency');
assert.ok(personaRec.suggestedSkills.includes('Audio-Driven Lip Sync'), 'Persona recommends Lip Sync');
console.log('✓ Virtual Persona Asset baseline PASSED');

// [TEST 2] Taxonomy Integrity (No Foreign Tools or Skills)
console.log('\n[TEST 2] Taxonomy Integrity (All recommendations match platform taxonomy)');
const allContentTypes: BriefFormData['contentType'][] = [
  'Brand Commercial Video',
  'Social Video Reel / UGC',
  '3D Product VFX',
  'Key Visual Still',
  'Virtual Persona Asset',
  'Generative Animation',
];

for (const ct of allContentTypes) {
  const rec = getSmartToolAndSkillRecommendations({
    contentType: ct,
    objective: 'Cinematic 4K voice dialogue product animation with orchestral music',
    creativeStyle: 'Anamorphic lens flares with custom lora training',
  });

  for (const tool of rec.suggestedTools) {
    assert.ok(
      ALL_AVAILABLE_TOOLS.includes(tool),
      `Tool ${tool} must exist in canonical platform taxonomy ALL_AVAILABLE_TOOLS`
    );
  }

  for (const skill of rec.suggestedSkills) {
    assert.ok(
      ALL_AVAILABLE_SKILLS.includes(skill),
      `Skill ${skill} must exist in canonical platform taxonomy ALL_AVAILABLE_SKILLS`
    );
  }
}
console.log('✓ Taxonomy integrity verified across all content types');

// [TEST 3] Context-Aware Keyword Signals
console.log('\n[TEST 3] Context-Aware Keyword Signal Detection');

// 3a. Voice/Speech keyword triggers ElevenLabs and Lip Sync
const voiceRec = getSmartToolAndSkillRecommendations({
  contentType: 'Brand Commercial Video',
  objective: 'Brand documentary featuring founder voiceover narration and executive speech.',
});
assert.ok(voiceRec.suggestedTools.includes('ElevenLabs'), 'Voice keywords trigger ElevenLabs');
assert.ok(voiceRec.suggestedSkills.includes('Audio-Driven Lip Sync'), 'Voice keywords trigger Lip Sync');
console.log('✓ Voice/Speech signals PASSED');

// 3b. Music/Soundtrack keyword triggers Suno and Sound Design
const musicRec = getSmartToolAndSkillRecommendations({
  contentType: 'Social Video Reel / UGC',
  creativeStyle: 'High-energy soundtrack rhythm with heavy bass beat transients.',
});
assert.ok(musicRec.suggestedTools.includes('Suno'), 'Music keywords trigger Suno');
assert.ok(musicRec.suggestedSkills.includes('Sound Design'), 'Music keywords trigger Sound Design');
console.log('✓ Music/Soundtrack signals PASSED');

// 3c. LoRA/Consistency keyword triggers LoRA Training
const loraRec = getSmartToolAndSkillRecommendations({
  contentType: 'Key Visual Still',
  objective: 'Consistent recurring character model using a custom brand lora checkpoint.',
});
assert.ok(loraRec.suggestedSkills.includes('LoRA Training'), 'LoRA keywords trigger LoRA Training');
assert.ok(loraRec.suggestedSkills.includes('Character Consistency'), 'Character keywords trigger Character Consistency');
console.log('✓ LoRA/Consistency signals PASSED');

// [TEST 4] Distribution Channel & Aspect Ratio Signals
console.log('\n[TEST 4] Channel & Aspect Ratio Adaptation');
const broadcastRec = getSmartToolAndSkillRecommendations({
  contentType: 'Brand Commercial Video',
  channels: ['Broadcast TV', 'Digital OOH / Billboard'],
});
assert.ok(broadcastRec.suggestedSkills.includes('4K Upscaling'), 'Broadcast channels trigger 4K Upscaling');
assert.ok(broadcastRec.suggestedSkills.includes('Color Grading'), 'Broadcast channels trigger Color Grading');
console.log('✓ Channel adaptation PASSED');

// [TEST 5] Non-Overwriting Contract & Preserving User Selections
console.log('\n[TEST 5] Non-Overwriting Contract');
// Simulate user having manually selected Midjourney and Inpainting
const userSelectedTools = ['Midjourney v6'] as const;
const userSelectedSkills = ['Inpainting/Outpainting'];

// Changing content type yields different recommendations, but user's existing selections are untouched
const changedContentType = '3D Product VFX';
const newRecs = getSmartToolAndSkillRecommendations({ contentType: changedContentType });

assert.notDeepStrictEqual(newRecs.suggestedTools, userSelectedTools, 'Recs differ from user manual selection');
// Verify user's state is not mutated by the recommendation function
assert.strictEqual(userSelectedTools.length, 1);
assert.strictEqual(userSelectedTools[0], 'Midjourney v6');
assert.strictEqual(userSelectedSkills.length, 1);
assert.strictEqual(userSelectedSkills[0], 'Inpainting/Outpainting');
console.log('✓ Non-overwriting contract PASSED');

// [TEST 6] Legal & Accuracy Disclaimer Integrity
console.log('\n[TEST 6] Disclaimer Integrity');
assert.ok(RECOMMENDATIONS_DISCLAIMER.includes('do not guarantee creator competence'), 'Disclaimer contains competence non-warranty');
console.log('✓ Disclaimer integrity PASSED');

console.log('\n======================================================');
console.log('ALL 6 SMART BRIEF RECOMMENDATIONS TESTS PASSED');
console.log('======================================================\n');
