import {
  RadarAttributes,
  AthletePerformanceReport,
  PerformanceInsight,
  StyleAttributeMetric,
  GymGradeScale,
  WallBoulder,
  Ascent,
  RecommendedBoulderInsight,
} from '../types/boulder';
import { getAscents } from './ratingAndAscentService';
import { getWallBoulders, getSectors, getGradeScales, getGyms } from './batchBoulderService';

const ATTRIBUTE_KEYS: (keyof RadarAttributes)[] = [
  'maximalkraft',
  'kraftausdauer',
  'technik',
  'balance',
  'koordination',
  'flexibilitaet',
];

const ATTRIBUTE_LABELS: Record<keyof RadarAttributes, string> = {
  maximalkraft: 'Maximalkraft',
  kraftausdauer: 'Kraft-Ausdauer',
  technik: 'Technik',
  balance: 'Balance',
  koordination: 'Koordination',
  flexibilitaet: 'Flexibilität',
  kraft: 'Maximalkraft',
};

const ATTRIBUTE_HEADLINES: Record<keyof RadarAttributes, { strength: string; weakness: string }> = {
  maximalkraft: {
    strength: 'MAXIMALKRAFT & FINGERSTÄRKE',
    weakness: 'EXPLOSIVE ZUG- & BLOCKIERKRAFT',
  },
  kraftausdauer: {
    strength: 'KRAFT-AUSDAUER & PUMPTOLERANZ',
    weakness: 'KRAFT-AUSDAUER & LANGE SEQUENZEN',
  },
  technik: {
    strength: 'TECHNIK & FUSSARBEIT',
    weakness: 'PRÄZISION & KÖRPERSPANNUNG',
  },
  balance: {
    strength: 'BALANCE & STABILITÄT',
    weakness: 'GLEICHGEWICHT & PLATTEN-GEFÜHL',
  },
  koordination: {
    strength: 'KOORDINATION & DYNAMIK',
    weakness: 'KOORDINATION & SPRUNG-TIMING',
  },
  flexibilitaet: {
    strength: 'FLEXIBILITÄT & BEWEGLICHKEIT',
    weakness: 'BEWEGLICHKEIT & HOHE TRITTE',
  },
  kraft: {
    strength: 'MAXIMALKRAFT & FINGERSTÄRKE',
    weakness: 'EXPLOSIVE ZUG- & BLOCKIERKRAFT',
  },
};

const ATTRIBUTE_DESCRIPTIONS: Record<keyof RadarAttributes, { strength: string; weakness: string }> = {
  maximalkraft: {
    strength: 'Überdurchschnittliche maximale Zug- und Fingerkraft. Du meisterst steile Überhänge und kleine Leisten mit hoher Entschlossenheit.',
    weakness: 'Schwierigkeiten bei explosiven Einzelzügen und maximalen Blockierpositionen. Ein gezieltes Krafttraining erschließt den nächsten Grad.',
  },
  kraftausdauer: {
    strength: 'Hervorragende Ausdauer über lange Zugsequenzen. Auch in pumpigen Dachrouten behältst du bis zum Topgriff volle Körperspannung.',
    weakness: 'Schneller Kraftverlust und Pump bei Boulderproblemen mit vielen Zügen. Kontinuierliche Traversen steigern deine Ausdauer.',
  },
  technik: {
    strength: 'Exzellente Trittpräzision und ökonomische Körperspannung. Du sparst Kraft durch saubere Schwerpunktverlagerung.',
    weakness: 'Häufiger Kraftverlust durch suboptimale Fußpositionierung. Sauberes Treten auf Reibung und Kanten spart wertvolle Körner.',
  },
  balance: {
    strength: 'Herausragendes Gleichgewicht auf Platten und Volumen. Du stehst selbst auf kleinsten Tritten extrem ruhig.',
    weakness: 'Unsicherheit bei delikaten Gewichtsverlagerungen und Reibungstritten. Plattenboulder fordern dich mental und technisch.',
  },
  koordination: {
    strength: 'Starkes Gespür für Schwungübertragung, Paddles und dynamische Catches. Du triffst Griffe im perfekten Timing.',
    weakness: 'Erhöhte Fehlversuche bei koordinativen Zügen, Dynos und weiten Sprüngen. Timing und Entschlossenheit sind die Hebel.',
  },
  flexibilitaet: {
    strength: 'Große Reichweite und Beweglichkeit. Hohe Tritte und weite Spreizschritte nutzt du spielerisch als Schlüsselsequenz.',
    weakness: 'Einschränkungen bei extrem hohen Antritten, Hook-Varianten und engem Raum. Hüftmobilität eröffnet neue Lösungswege.',
  },
  kraft: {
    strength: 'Überdurchschnittliche maximale Zug- und Fingerkraft. Du meisterst steile Überhänge und kleine Leisten mit hoher Entschlossenheit.',
    weakness: 'Schwierigkeiten bei explosiven Einzelzügen und maximalen Blockierpositionen. Ein gezieltes Krafttraining erschließt den nächsten Grad.',
  },
};

export function getAthletePerformanceReport(
  userId: string,
  selectedGymId: string = 'all'
): AthletePerformanceReport {
  const gyms = getGyms();
  const defaultGym = gyms[0];
  const activeGymId = selectedGymId !== 'all' ? selectedGymId : defaultGym?.id || 'gym-minimum-zh';
  const gymName = gyms.find(g => g.id === activeGymId)?.name || 'Minimum Boulder Zürich';

  const allAscents = getAscents();
  const userAscents = allAscents.filter(a => a.userId === userId);

  const allBoulders = getWallBoulders(); // Includes active AND archived boulders
  const allSectors = getSectors(activeGymId);
  const allScales = getGradeScales(activeGymId);

  // Mappings
  const boulderMap = new Map<string, WallBoulder>();
  allBoulders.forEach(b => boulderMap.set(b.id, b));

  const sectorMap = new Map<string, { id: string; name: string; gymId: string }>();
  allSectors.forEach(s => sectorMap.set(s.id, { id: s.id, name: s.name, gymId: s.gymId }));

  const scaleMap = new Map<string, GymGradeScale>();
  allScales.forEach(s => scaleMap.set(s.id, s));

  // 1. Filter user ascents by gym (if not 'all')
  const scopedAscents: { ascent: Ascent; boulder: WallBoulder; gradeScale: GymGradeScale }[] = [];

  for (const ascent of userAscents) {
    const boulder = boulderMap.get(ascent.boulderId);
    if (!boulder) continue;

    const sector = sectorMap.get(boulder.sectorId);
    const gymId = sector?.gymId || defaultGym?.id || 'gym-minimum-zh';

    if (selectedGymId !== 'all' && gymId !== selectedGymId) {
      continue;
    }

    const gradeScale = scaleMap.get(boulder.gradeScaleId) || allScales[0] || {
      id: 'scale-fallback',
      gymId,
      colorName: 'Blau',
      colorHex: '#3b82f6',
      difficultyLabel: 'Mittel',
      fontRangeMin: '5c',
      fontRangeMax: '6a',
      sortOrder: 2,
    };

    scopedAscents.push({ ascent, boulder, gradeScale });
  }

  // 2. Calculate Gym Radar (Anforderungsprofil der Halle)
  // Considers active boulders of the gym (or all if none active)
  const gymBoulders = allBoulders.filter(b => {
    const sector = sectorMap.get(b.sectorId);
    const gId = sector?.gymId || defaultGym?.id || 'gym-minimum-zh';
    return selectedGymId === 'all' || gId === selectedGymId;
  });

  const activeGymBoulders = gymBoulders.filter(b => b.status === 'active');
  const referenceBoulders = activeGymBoulders.length > 0 ? activeGymBoulders : gymBoulders;

  const gymRadar: RadarAttributes = {
    maximalkraft: 3,
    kraftausdauer: 3,
    technik: 3,
    balance: 3,
    koordination: 3,
    flexibilitaet: 3,
    kraft: 3,
  };

  if (referenceBoulders.length > 0) {
    for (const key of ATTRIBUTE_KEYS) {
      const sum = referenceBoulders.reduce((acc, b) => {
        const val = b.radar[key] ?? (key === 'maximalkraft' ? b.radar.kraft ?? 3 : 3);
        return acc + val;
      }, 0);
      gymRadar[key] = parseFloat((sum / referenceBoulders.length).toFixed(1));
    }
    gymRadar.kraft = gymRadar.maximalkraft;
  }

  const loggedAscentsCount = scopedAscents.length;
  const minRequiredAscents = 5;

  // If under minimum requirement, return locked report
  if (loggedAscentsCount < minRequiredAscents) {
    return {
      userId,
      gymId: selectedGymId,
      gymName,
      isUnlocked: false,
      loggedAscentsCount,
      minRequiredAscents,
      medianGradeOrder: 0,
      userRadar: {
        maximalkraft: 3,
        kraftausdauer: 3,
        technik: 3,
        balance: 3,
        koordination: 3,
        flexibilitaet: 3,
        kraft: 3,
      },
      gymRadar,
      strength: null,
      weakness: null,
      attributeMetrics: [],
    };
  }

  // 3. Compute Median Grade Order (Benchmark)
  const toppedAscents = scopedAscents.filter(
    item => item.ascent.type === 'top' || item.ascent.type === 'flash'
  );

  const gradeOrders = (toppedAscents.length > 0 ? toppedAscents : scopedAscents)
    .map(item => item.gradeScale.sortOrder)
    .sort((a, b) => a - b);

  const midIndex = Math.floor(gradeOrders.length / 2);
  const medianGradeOrder =
    gradeOrders.length % 2 !== 0
      ? gradeOrders[midIndex]
      : (gradeOrders[midIndex - 1] + gradeOrders[midIndex]) / 2;

  // 4. Calculate User Performance Scores via GNPI
  const weightedScores: Record<keyof RadarAttributes, number> = {
    maximalkraft: 0,
    kraftausdauer: 0,
    technik: 0,
    balance: 0,
    koordination: 0,
    flexibilitaet: 0,
    kraft: 0,
  };

  const weightTotals: Record<keyof RadarAttributes, number> = {
    maximalkraft: 0,
    kraftausdauer: 0,
    technik: 0,
    balance: 0,
    koordination: 0,
    flexibilitaet: 0,
    kraft: 0,
  };

  for (const { ascent, boulder, gradeScale } of scopedAscents) {
    const deltaG = gradeScale.sortOrder - medianGradeOrder;

    // Relevance factor R(G) - limit relevance focus
    let relevance = 1.0;
    if (deltaG === -2) relevance = 0.5;
    else if (deltaG <= -3) relevance = 0.25;

    // Success multiplier S
    let success = 1.0;
    if (ascent.type === 'flash') {
      success = 1.3 * (1 + 0.25 * deltaG);
    } else if (ascent.type === 'top') {
      success = 1.0 * (1 + 0.2 * deltaG);
    } else {
      // project
      success = deltaG < 0 ? Math.max(0.05, 0.15 + 0.1 * deltaG) : 0.2 * (1 + 0.15 * deltaG);
    }

    const mkVal = boulder.radar.maximalkraft ?? boulder.radar.kraft ?? 3;
    const kaVal = boulder.radar.kraftausdauer ?? 3;
    const radarSum =
      mkVal +
      kaVal +
      (boulder.radar.technik || 3) +
      (boulder.radar.balance || 3) +
      (boulder.radar.koordination || 3) +
      (boulder.radar.flexibilitaet || 3);

    for (const key of ATTRIBUTE_KEYS) {
      const val =
        key === 'maximalkraft'
          ? mkVal
          : key === 'kraftausdauer'
          ? kaVal
          : boulder.radar[key] || 3;
      const weight = val / Math.max(1, radarSum);
      const effectiveWeight = relevance * weight;

      weightedScores[key] += effectiveWeight * success * val;
      weightTotals[key] += effectiveWeight;
    }
  }

  // Raw scores Pa
  const rawScores: Record<keyof RadarAttributes, number> = {
    maximalkraft: 0,
    kraftausdauer: 0,
    technik: 0,
    balance: 0,
    koordination: 0,
    flexibilitaet: 0,
    kraft: 0,
  };

  let rawTotal = 0;
  for (const key of ATTRIBUTE_KEYS) {
    const raw = weightedScores[key] / Math.max(0.001, weightTotals[key]);
    rawScores[key] = raw;
    rawTotal += raw;
  }

  const meanRawScore = rawTotal / ATTRIBUTE_KEYS.length;

  // Normalized 1.0 to 5.0 scale centered around 3.0
  const userRadar: RadarAttributes = {
    maximalkraft: 3,
    kraftausdauer: 3,
    technik: 3,
    balance: 3,
    koordination: 3,
    flexibilitaet: 3,
    kraft: 3,
  };

  for (const key of ATTRIBUTE_KEYS) {
    const deviation = rawScores[key] - meanRawScore;
    const normalized = Math.max(1.0, Math.min(5.0, 3.0 + deviation * 1.5));
    userRadar[key] = parseFloat(normalized.toFixed(1));
  }
  userRadar.kraft = userRadar.maximalkraft;

  // 5. Build Style Attribute Metrics Table
  const attributeMetrics: StyleAttributeMetric[] = ATTRIBUTE_KEYS.map(key => {
    // Find ascents where this attribute is dominant (val >= 4, fallback to >= 3)
    const getAttr = (b: WallBoulder) =>
      key === 'maximalkraft'
        ? b.radar.maximalkraft ?? b.radar.kraft ?? 3
        : key === 'kraftausdauer'
        ? b.radar.kraftausdauer ?? 3
        : b.radar[key] || 3;

    let matched = scopedAscents.filter(item => getAttr(item.boulder) >= 4);
    if (matched.length === 0) {
      matched = scopedAscents.filter(item => getAttr(item.boulder) >= 3);
    }

    const attemptsCount = matched.length;
    const topCount = matched.filter(
      item => item.ascent.type === 'top' || item.ascent.type === 'flash'
    ).length;
    const flashCount = matched.filter(item => item.ascent.type === 'flash').length;

    const sendRatePercent =
      attemptsCount > 0 ? Math.round((topCount / attemptsCount) * 100) : 0;
    const flashRatePercent =
      topCount > 0 ? Math.round((flashCount / topCount) * 100) : 0;

    // Highest grade topped for this attribute
    let highestGrade: GymGradeScale | undefined;
    let highestOrder = -1;
    for (const item of matched) {
      if (
        (item.ascent.type === 'top' || item.ascent.type === 'flash') &&
        item.gradeScale.sortOrder > highestOrder
      ) {
        highestOrder = item.gradeScale.sortOrder;
        highestGrade = item.gradeScale;
      }
    }

    const userScore = userRadar[key] ?? 3;
    const gymScore = gymRadar[key] ?? 3;
    const delta = parseFloat((userScore - gymScore).toFixed(1));

    return {
      key,
      label: ATTRIBUTE_LABELS[key],
      userScore,
      gymScore,
      delta,
      sendRatePercent,
      flashRatePercent,
      highestGradeTopped: highestGrade,
      attemptsCount,
    };
  });

  // 6. Identify Strength and Weakness (Baustelle)
  const sortedByDelta = [...attributeMetrics].sort((a, b) => b.delta - a.delta);
  const bestMetric = sortedByDelta[0];
  const worstMetric = sortedByDelta[sortedByDelta.length - 1];

  // Helper to find a recommended training boulder in the gym
  const findTrainingBoulder = (
    attributeKey: keyof RadarAttributes
  ): RecommendedBoulderInsight | undefined => {
    // Active boulders with high attribute value
    const candidates = referenceBoulders.filter(b => {
      const val =
        attributeKey === 'maximalkraft'
          ? b.radar.maximalkraft ?? b.radar.kraft ?? 3
          : attributeKey === 'kraftausdauer'
          ? b.radar.kraftausdauer ?? 3
          : b.radar[attributeKey] || 3;
      return b.status === 'active' && val >= 4;
    });

    if (candidates.length === 0) return undefined;

    // Pick a boulder close to or slightly above user's median
    const sortedCandidates = candidates.sort((a, b) => {
      const scaleA = scaleMap.get(a.gradeScaleId)?.sortOrder || 1;
      const scaleB = scaleMap.get(b.gradeScaleId)?.sortOrder || 1;
      return Math.abs(scaleA - medianGradeOrder) - Math.abs(scaleB - medianGradeOrder);
    });

    const chosen = sortedCandidates[0];
    const sector = sectorMap.get(chosen.sectorId);
    const scale = scaleMap.get(chosen.gradeScaleId);

    const chosenAttrVal =
      attributeKey === 'maximalkraft'
        ? chosen.radar.maximalkraft ?? chosen.radar.kraft ?? 4
        : attributeKey === 'kraftausdauer'
        ? chosen.radar.kraftausdauer ?? 4
        : chosen.radar[attributeKey] || 4;

    return {
      id: chosen.id,
      name: chosen.name || `${scale?.colorName || 'Boulder'} #${chosen.id.slice(-4)}`,
      sectorName: sector?.name || 'Sektor',
      gradeColorHex: scale?.colorHex || '#3b82f6',
      gradeColorName: scale?.colorName || 'Blau',
      difficultyLabel: scale?.difficultyLabel || 'Mittel',
      attributeValue: chosenAttrVal,
    };
  };

  // Build Strength Insight
  const strengthHighlight = `${bestMetric.delta >= 0 ? '+' : ''}${bestMetric.delta.toFixed(
    1
  )} über Hallenschnitt · ${bestMetric.sendRatePercent}% Send-Quote${
    bestMetric.highestGradeTopped
      ? ` · Max-Grad: ${bestMetric.highestGradeTopped.colorName} (${bestMetric.highestGradeTopped.fontRangeMax || bestMetric.highestGradeTopped.difficultyLabel})`
      : ''
  }`;

  const strength: PerformanceInsight = {
    attribute: bestMetric.key,
    attributeLabel: bestMetric.label,
    type: 'strength',
    headline: ATTRIBUTE_HEADLINES[bestMetric.key].strength,
    description: ATTRIBUTE_DESCRIPTIONS[bestMetric.key].strength,
    metricHighlight: strengthHighlight,
  };

  // Build Weakness Insight with Training Recommendation
  const weaknessHighlight = `${worstMetric.delta.toFixed(1)} unter Hallenschnitt · ${
    worstMetric.attemptsCount -
    Math.round((worstMetric.sendRatePercent / 100) * worstMetric.attemptsCount)
  } offene Projekte`;

  const recommended = findTrainingBoulder(worstMetric.key);

  const weakness: PerformanceInsight = {
    attribute: worstMetric.key,
    attributeLabel: worstMetric.label,
    type: 'weakness',
    headline: ATTRIBUTE_HEADLINES[worstMetric.key].weakness,
    description: ATTRIBUTE_DESCRIPTIONS[worstMetric.key].weakness,
    metricHighlight: weaknessHighlight,
    recommendedBoulder: recommended,
  };

  return {
    userId,
    gymId: selectedGymId,
    gymName,
    isUnlocked: true,
    loggedAscentsCount,
    minRequiredAscents,
    medianGradeOrder,
    userRadar,
    gymRadar,
    strength,
    weakness,
    attributeMetrics,
  };
}
