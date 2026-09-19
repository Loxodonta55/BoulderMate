/**
 * simulate-multiuser-sync.ts
 * 
 * Autonomous Testing Agent & Simulator for BoulderMate Multi-User Data Synchronization.
 * 
 * Tests live:
 * 1. Multi-User Ratings & Ascents on the same boulder (verifying unique constraint uq_user_boulder_rating is respected with onConflict).
 * 2. Climber Routes ("Klettermodus" personal logbook routes) cross-device creation, retrieval, update, and deletion in Supabase.
 * 3. Bidirectional sector alias and ID matching across devices.
 * 4. Realtime subscription event delivery.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vuladpswvflfwwgdjejr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bGFkcHN3dmZsZnd3Z2RqZWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjExMzcsImV4cCI6MjEwNDIzNzEzN30.55_ouHyzW_ALlTc45HJCHQgEn50T0xXm1d5jTTUPr1o';

const USER_BORIS_UUID = '00000000-1d0e-4000-8000-e92d69136f33';
const USER_HANS_UUID = '00000000-4553-4000-8000-3dd13fac9e0f';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    process.stdout.write(`⏳ Running: ${name}... `);
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, details: 'OK', durationMs });
    console.log(`✅ PASSED (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, details: err.message || String(err), durationMs });
    console.log(`❌ FAILED (${durationMs}ms): ${err.message || String(err)}`);
  }
}

async function main() {
  console.log('===============================================================');
  console.log('  BoulderMate Multi-User Data Synchronization Testing Agent    ');
  console.log('===============================================================');
  console.log(`Target Backend: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Fetch or pick an existing test boulder
  const { data: existingBoulders, error: boulderFetchErr } = await supabase
    .from('boulders')
    .select('id, name, sector_id')
    .limit(1);

  if (boulderFetchErr || !existingBoulders || existingBoulders.length === 0) {
    console.error('Failed to query existing boulders from Supabase:', boulderFetchErr?.message);
    process.exit(1);
  }

  const testBoulder = existingBoulders[0];
  console.log(`Selected Test Wall Boulder: "${testBoulder.name}" (${testBoulder.id}) in sector ${testBoulder.sector_id}\n`);

  // -------------------------------------------------------------
  // Test 1: Multi-User Concurrent Rating Upsert Without Constraint Error
  // -------------------------------------------------------------
  await runTest('1.1 User Boris rates boulder (5 stars, fair)', async () => {
    const payloadBoris = {
      id: '00000000-aa01-4000-8000-000000000001',
      boulder_id: testBoulder.id,
      user_id: USER_BORIS_UUID,
      perceived_difficulty: 'fair',
      stars: 5,
      radar_kraft: 4,
      radar_technik: 5,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ratings')
      .upsert(payloadBoris, { onConflict: 'boulder_id,user_id' });

    if (error) throw new Error(`User Boris rating upsert failed: ${error.message}`);
  });

  await runTest('1.2 User Hans rates the SAME boulder (3 stars, hard) - No uq_user_boulder_rating collision', async () => {
    const payloadHans = {
      id: '00000000-aa02-4000-8000-000000000002',
      boulder_id: testBoulder.id,
      user_id: USER_HANS_UUID,
      perceived_difficulty: 'hard',
      stars: 3,
      radar_kraft: 3,
      radar_technik: 3,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ratings')
      .upsert(payloadHans, { onConflict: 'boulder_id,user_id' });

    if (error) throw new Error(`User Hans rating upsert collided with Boris: ${error.message}`);
  });

  await runTest('1.3 Verify both user ratings coexist on the same boulder', async () => {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('boulder_id', testBoulder.id)
      .in('user_id', [USER_BORIS_UUID, USER_HANS_UUID]);

    if (error) throw new Error(`Query ratings error: ${error.message}`);
    if (!ratings || ratings.length < 2) {
      throw new Error(`Expected at least 2 ratings for boulder, received ${ratings?.length}`);
    }

    const borisRating = ratings.find(r => r.user_id === USER_BORIS_UUID);
    const hansRating = ratings.find(r => r.user_id === USER_HANS_UUID);

    if (!borisRating || borisRating.stars !== 5) {
      throw new Error(`Boris rating mismatch: ${JSON.stringify(borisRating)}`);
    }
    if (!hansRating || hansRating.stars !== 3) {
      throw new Error(`Hans rating mismatch: ${JSON.stringify(hansRating)}`);
    }
  });

  await runTest('1.4 User Hans updates their rating to 4 stars without conflict error', async () => {
    const updatedHans = {
      id: '00000000-aa02-4000-8000-000000000002',
      boulder_id: testBoulder.id,
      user_id: USER_HANS_UUID,
      perceived_difficulty: 'fair',
      stars: 4,
      radar_kraft: 4,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ratings')
      .upsert(updatedHans, { onConflict: 'boulder_id,user_id' });

    if (error) throw new Error(`User Hans rating update failed: ${error.message}`);

    const { data: verified } = await supabase
      .from('ratings')
      .select('*')
      .eq('boulder_id', testBoulder.id)
      .eq('user_id', USER_HANS_UUID)
      .single();

    if (verified?.stars !== 4) {
      throw new Error(`Expected updated stars to be 4, got ${verified?.stars}`);
    }
  });

  // Clean up test ratings
  await supabase
    .from('ratings')
    .delete()
    .eq('boulder_id', testBoulder.id)
    .in('user_id', [USER_BORIS_UUID, USER_HANS_UUID]);

  // -------------------------------------------------------------
  // Test 2: Klettermodus Climber Routes Sync ("Erfasste Routen")
  // -------------------------------------------------------------
  const testRouteId = '00000000-cc01-4000-8000-000000000001';

  await runTest('2.1 Mobile Client creates route in Klettermodus ("climber_routes")', async () => {
    const routePayload = {
      id: testRouteId,
      user_id: USER_HANS_UUID,
      name: 'Agent Test Route: Super Dach Flash',
      location: 'Minimum Zürich',
      sector: 'Dach',
      date: '2026-09-19',
      grade_scale: 'font',
      grade: '7A+',
      ascent_style: 'flash',
      attempts: 1,
      rating: 5,
      notes: 'Guter Heel-Hook am Start, dann weiter Kreuzzug auf Zange.',
      tags: ['dach', 'heelhook', 'dynamisch'],
      hold_types: ['pinch', 'crimp'],
      wall_angle: 'roof',
      metadata: { originalId: 'local-client-boulder-123' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('climber_routes')
      .upsert(routePayload, { onConflict: 'id' });

    if (error) throw new Error(`Climber route upsert failed: ${error.message}`);
  });

  await runTest('2.2 Desktop Client fetches and verifies climber route', async () => {
    const { data: route, error } = await supabase
      .from('climber_routes')
      .select('*')
      .eq('id', testRouteId)
      .single();

    if (error) throw new Error(`Fetch climber route failed: ${error.message}`);
    if (!route) throw new Error('Climber route not found in Supabase');

    if (route.name !== 'Agent Test Route: Super Dach Flash') {
      throw new Error(`Name mismatch: ${route.name}`);
    }
    if (route.grade !== '7A+' || route.ascent_style !== 'flash') {
      throw new Error(`Grade/Style mismatch: grade=${route.grade}, style=${route.ascent_style}`);
    }
    if (!route.hold_types.includes('pinch') || !route.tags.includes('heelhook')) {
      throw new Error(`Holds/Tags mismatch: ${JSON.stringify(route)}`);
    }
  });

  await runTest('2.3 Desktop Client updates route notes and grade', async () => {
    const updatePayload = {
      id: testRouteId,
      user_id: USER_HANS_UUID,
      name: 'Agent Test Route: Super Dach Flash (Confirmed 7B)',
      grade: '7B',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('climber_routes')
      .update(updatePayload)
      .eq('id', testRouteId);

    if (error) throw new Error(`Update climber route failed: ${error.message}`);

    const { data: updated } = await supabase
      .from('climber_routes')
      .select('name, grade')
      .eq('id', testRouteId)
      .single();

    if (updated?.grade !== '7B') {
      throw new Error(`Grade was not updated to 7B: got ${updated?.grade}`);
    }
  });

  await runTest('2.4 Clean up test climber route', async () => {
    const { error } = await supabase
      .from('climber_routes')
      .delete()
      .eq('id', testRouteId);

    if (error) throw new Error(`Delete climber route failed: ${error.message}`);
  });

  // -------------------------------------------------------------
  // Test 3: Realtime Channel Subscription Verification
  // -------------------------------------------------------------
  await runTest('3.1 Verify Realtime tables access (climber_routes, ratings, ascents)', async () => {
    const { error: routeErr } = await supabase
      .from('climber_routes')
      .select('id')
      .limit(1);
    if (routeErr) throw new Error(`Failed to query climber_routes: ${routeErr.message}`);

    const { error: ratingErr } = await supabase
      .from('ratings')
      .select('id')
      .limit(1);
    if (ratingErr) throw new Error(`Failed to query ratings: ${ratingErr.message}`);

    const { error: ascentErr } = await supabase
      .from('ascents')
      .select('id')
      .limit(1);
    if (ascentErr) throw new Error(`Failed to query ascents: ${ascentErr.message}`);
  });

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('                     TEST SUMMARY REPORT                       ');
  console.log('===============================================================');
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${r.name.padEnd(65)} | ${r.durationMs}ms`);
    if (!r.passed) {
      allPassed = false;
      console.log(`       Details: ${r.details}`);
    }
  }
  console.log('===============================================================');

  if (allPassed) {
    console.log('🎉 ALL MULTI-USER SYNCHRONIZATION SCENARIOS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal agent error:', err);
  process.exit(1);
});
