(function() {
  function readGlobal(name) {
    const value = window[name];
    if (typeof value === "undefined") {
      throw new Error("Missing global dependency: " + name);
    }
    return value;
  }

  function callGlobal(name) {
    const fn = readGlobal(name);
    if (typeof fn !== "function") {
      throw new Error("Global dependency is not callable: " + name);
    }
    return fn.apply(window, Array.prototype.slice.call(arguments, 1));
  }

  function createContext(options) {
    const config = options || {};
    const shouldLoadRequests = Object.prototype.hasOwnProperty.call(config, "requests") || !!config.includeRequests;
    return {
      students: Array.isArray(config.students) ? config.students : callGlobal("loadStudents"),
      offers: Array.isArray(config.offers) ? config.offers : callGlobal("loadOffers"),
      requests: Array.isArray(config.requests)
        ? config.requests
        : (shouldLoadRequests ? callGlobal("loadFullProfileRequests") : [])
    };
  }

  function buildMatchMetaResult(payload) {
    const data = payload || {};
    return {
      matchedProfession: data.matchedProfession || "",
      isVisibleMatch: !!data.isVisibleMatch,
      isInclusionMatch: !!data.isInclusionMatch,
      isAlternativeMatch: !!data.isAlternativeMatch,
      isActivatedAlternativeProfession: !!data.isActivatedAlternativeProfession,
      alternativeFamilyKey: data.alternativeFamilyKey || "",
      alternativeFamilyLabel: data.alternativeFamilyLabel || "",
      alternativeExplanation: data.alternativeExplanation || "",
      matchLabel: data.matchLabel || "Direktes Match",
      distanceKm: typeof data.distanceKm === "number" ? data.distanceKm : null,
      distanceLabel: data.distanceLabel || "Distanz unbekannt",
      isDistanceKnown: !!data.isDistanceKnown,
      isWithinRadius: !!data.isWithinRadius,
      studentRadiusValue: data.studentRadiusValue || "",
      studentRadiusLabel: data.studentRadiusLabel || "",
      offerRadiusValue: data.offerRadiusValue || "",
      offerRadiusLabel: data.offerRadiusLabel || ""
    };
  }

  function buildMatchEntryResult(payload) {
    const data = payload || {};
    return {
      student: data.student || null,
      offer: data.offer || null,
      summary: data.summary || null,
      score: Number(data.score || 0),
      fitScore: Number(data.fitScore || 0),
      profileCompletenessScore: Number(data.profileCompletenessScore || 0),
      matchedProfession: data.matchedProfession || "",
      isInclusionMatch: !!data.isInclusionMatch,
      isAlternativeMatch: !!data.isAlternativeMatch,
      isActivatedAlternativeProfession: !!data.isActivatedAlternativeProfession,
      alternativeFamilyKey: data.alternativeFamilyKey || "",
      alternativeFamilyLabel: data.alternativeFamilyLabel || "",
      matchLabel: data.matchLabel || "Direktes Match",
      distanceKm: typeof data.distanceKm === "number" ? data.distanceKm : null,
      distanceLabel: data.distanceLabel || "Distanz unbekannt",
      studentRadiusLabel: data.studentRadiusLabel || "",
      offerRadiusLabel: data.offerRadiusLabel || "",
      isVisibleMatch: !!data.isVisibleMatch
    };
  }

  function getLatestFullProfileRequestForPair(requests, firmId, student, matchedProfession) {
    const list = Array.isArray(requests) ? requests : [];
    const normalizedProfession = callGlobal("normalizeProfessionText", matchedProfession || "");

    for (let index = list.length - 1; index >= 0; index -= 1) {
      const entry = list[index];
      if (!entry || entry.firmId !== firmId) continue;
      if (!callGlobal("isSameFullProfileRequestStudent", entry, student)) continue;
      if (normalizedProfession) {
        const entryProfession = callGlobal("normalizeProfessionText", callGlobal("getStoredRequestProfession", entry));
        if (!entryProfession || entryProfession !== normalizedProfession) continue;
      }
      return entry;
    }

    return null;
  }

  function isStudentFirmProfessionBlocked(student, firm, matchedProfession) {
    if (!student || !firm || !Array.isArray(student.gesperrteAbsender)) {
      return false;
    }

    const normalizedMatchedProfession = callGlobal("normalizeProfessionText", matchedProfession || student.beruf || "");
    return student.gesperrteAbsender.some(function(entry) {
      if (typeof entry === "string") {
        return entry === firm.firma;
      }
      if (!entry || entry.firma !== firm.firma) {
        return false;
      }
      const blockedProfession = callGlobal("normalizeProfessionText", entry.beruf || "");
      if (!blockedProfession) {
        return true;
      }
      return !!normalizedMatchedProfession && blockedProfession === normalizedMatchedProfession;
    });
  }

  function isStudentFirmMatchSuppressed(student, firm, matchedProfession, requests) {
    if (isStudentFirmProfessionBlocked(student, firm, matchedProfession)) {
      return true;
    }

    const latestRequest = getLatestFullProfileRequestForPair(
      requests,
      firm && (firm.id || firm.userId || ""),
      student,
      matchedProfession
    );
    return !!(latestRequest && callGlobal("isRejectedFullProfileRequestStatus", latestRequest.status));
  }

  function getAlternativeMatchedProfession(student, offer, offers) {
    if (!student || !offer) return null;
    if (callGlobal("getExactMatchedProfession", student, offer)) return null;

    const offerList = Array.isArray(offers) ? offers : callGlobal("loadOffers");
    if (hasExactProfessionMatchForStudent(student, offerList, { respectRadius: true })) return null;

    const studentFamily = callGlobal("getProfessionFamily", student.beruf);
    if (!studentFamily) return null;

    const alternativeProfession = callGlobal("getOfferProfessionList", offer).find(function(entry) {
      const offerFamily = callGlobal("getProfessionFamily", entry);
      return !!(offerFamily && offerFamily.key === studentFamily.key);
    });

    if (!alternativeProfession) return null;

    return {
      matchedProfession: alternativeProfession,
      familyKey: studentFamily.key,
      familyLabel: studentFamily.label
    };
  }

  function buildAlternativeMatchExplanation(student, matchedProfession, familyLabel) {
    const desiredProfession = String(student && student.beruf ? student.beruf : "dein Wunschberuf").trim() || "dein Wunschberuf";
    const proposedProfession = String(matchedProfession || "der vorgeschlagene Ausbildungsberuf").trim() || "der vorgeschlagene Ausbildungsberuf";
    const sharedFamily = String(familyLabel || "demselben Berufsfeld").trim() || "demselben Berufsfeld";

    return 'Dein Wunschberuf "' + desiredProfession + '" und der vorgeschlagene Ausbildungsberuf "' + proposedProfession + '" liegen beide im Berufsfeld "' + sharedFamily + '". Weil aktuell kein direkter Treffer für "' + desiredProfession + '" im Portal vorhanden ist, zeigen wir dir diese Alternative als nächsten passenden Einstieg.';
  }

  function offerSupportsInclusionMatch(offer) {
    const value = callGlobal("normalizeAnswerValue", offer && offer.platzBehindert);
    return value === "ja" || value === "yes" || value === "true" || value === "1";
  }

  function isInternshipDateMatchVisible(student, offer) {
    const isInternshipContext = !!((student && student.isInternship) || (offer && offer.isInternship));
    if (!isInternshipContext) {
      return true;
    }

    const studentStart = callGlobal("normalizeInternshipDateValue", student && student.praktikumStartdatum);
    const studentEnd = callGlobal("normalizeInternshipDateValue", student && student.praktikumEnddatum);
    const offerStart = callGlobal("normalizeInternshipDateValue", offer && offer.praktikumStartdatum);
    const offerEnd = callGlobal("normalizeInternshipDateValue", offer && offer.praktikumEnddatum);

    if (!studentStart || !studentEnd || !offerStart || !offerEnd) {
      return false;
    }

    const overlapStart = studentStart > offerStart ? studentStart : offerStart;
    const overlapEnd = studentEnd < offerEnd ? studentEnd : offerEnd;
    return overlapStart <= overlapEnd;
  }

  function getMatchMeta(student, offer, options) {
    const config = options || {};
    const context = createContext({ offers: config.allOffers });
    const allOffers = context.offers;
    const distanceMeta = callGlobal("getMatchDistanceMeta", student, offer);
    if (!callGlobal("isStudentSearchActiveForOffer", student, offer)) {
      return buildMatchMetaResult({
        matchedProfession: "",
        isVisibleMatch: false,
        isInclusionMatch: false,
        isAlternativeMatch: false,
        isActivatedAlternativeProfession: false,
        alternativeFamilyKey: "",
        alternativeFamilyLabel: "",
        alternativeExplanation: "",
        matchLabel: "Direktes Match",
        distanceKm: distanceMeta.distanceKm,
        distanceLabel: distanceMeta.distanceLabel,
        isDistanceKnown: distanceMeta.isDistanceKnown,
        isWithinRadius: distanceMeta.isWithinRadius,
        studentRadiusValue: distanceMeta.studentRadiusValue,
        studentRadiusLabel: distanceMeta.studentRadiusLabel,
        offerRadiusValue: distanceMeta.offerRadiusValue,
        offerRadiusLabel: distanceMeta.offerRadiusLabel
      });
    }
    if (!callGlobal("isFirmApprenticeshipMatchingEnabled", offer)) {
      return buildMatchMetaResult({
        matchedProfession: "",
        isVisibleMatch: false,
        isInclusionMatch: false,
        isAlternativeMatch: false,
        isActivatedAlternativeProfession: false,
        alternativeFamilyKey: "",
        alternativeFamilyLabel: "",
        alternativeExplanation: "",
        matchLabel: "Direktes Match",
        distanceKm: distanceMeta.distanceKm,
        distanceLabel: distanceMeta.distanceLabel,
        isDistanceKnown: distanceMeta.isDistanceKnown,
        isWithinRadius: distanceMeta.isWithinRadius,
        studentRadiusValue: distanceMeta.studentRadiusValue,
        studentRadiusLabel: distanceMeta.studentRadiusLabel,
        offerRadiusValue: distanceMeta.offerRadiusValue,
        offerRadiusLabel: distanceMeta.offerRadiusLabel
      });
    }
    const exactMatchedProfession = callGlobal("getExactMatchedProfession", student, offer);
    const activatedAlternativeMatch = exactMatchedProfession ? null : callGlobal("getActivatedAlternativeProfessionMatch", student, offer);
    const alternativeMatch = exactMatchedProfession || activatedAlternativeMatch ? null : getAlternativeMatchedProfession(student, offer, allOffers);
    const matchedProfession = exactMatchedProfession
      || (activatedAlternativeMatch && activatedAlternativeMatch.matchedProfession)
      || (alternativeMatch && alternativeMatch.matchedProfession)
      || "";
    const isActivatedAlternativeProfession = !exactMatchedProfession && !!activatedAlternativeMatch;
    const isAlternativeMatch = !exactMatchedProfession && !activatedAlternativeMatch && !!alternativeMatch;
    const isInclusionMatch = !!matchedProfession && callGlobal("studentNeedsInclusionSupport", student) && offerSupportsInclusionMatch(offer);
    let matchLabel = "Direktes Match";
    if (isAlternativeMatch && isInclusionMatch) {
      matchLabel = "Inklusions-Berufsfeld-Match";
    } else if (isActivatedAlternativeProfession && isInclusionMatch) {
      matchLabel = "Aktivierter Inklusions-Match";
    } else if (isInclusionMatch) {
      matchLabel = "Inklusions-Match";
    } else if (isActivatedAlternativeProfession) {
      matchLabel = "Aktivierter Alternativberuf";
    } else if (isAlternativeMatch) {
      matchLabel = "Berufsfeld-Match";
    }

    const alternativeFamilyLabel = alternativeMatch
      ? alternativeMatch.familyLabel
      : (activatedAlternativeMatch ? activatedAlternativeMatch.familyLabel : "");
    const alternativeExplanation = isAlternativeMatch
      ? buildAlternativeMatchExplanation(student, matchedProfession, alternativeFamilyLabel)
      : "";

    return buildMatchMetaResult({
      matchedProfession: matchedProfession,
      isVisibleMatch: !!matchedProfession && distanceMeta.isWithinRadius && isInternshipDateMatchVisible(student, offer),
      isInclusionMatch: isInclusionMatch,
      isAlternativeMatch: isAlternativeMatch,
      isActivatedAlternativeProfession: isActivatedAlternativeProfession,
      alternativeFamilyKey: alternativeMatch ? alternativeMatch.familyKey : (activatedAlternativeMatch ? activatedAlternativeMatch.familyKey : ""),
      alternativeFamilyLabel: alternativeFamilyLabel,
      alternativeExplanation: alternativeExplanation,
      matchLabel: matchLabel,
      distanceKm: distanceMeta.distanceKm,
      distanceLabel: distanceMeta.distanceLabel,
      isDistanceKnown: distanceMeta.isDistanceKnown,
      isWithinRadius: distanceMeta.isWithinRadius,
      studentRadiusValue: distanceMeta.studentRadiusValue,
      studentRadiusLabel: distanceMeta.studentRadiusLabel,
      offerRadiusValue: distanceMeta.offerRadiusValue,
      offerRadiusLabel: distanceMeta.offerRadiusLabel
    });
  }

  function evaluateStudentOfferMatch(student, offer, context) {
    const resolvedContext = createContext(context);
    const matchMeta = getMatchMeta(student, offer, { allOffers: resolvedContext.offers });
    const fitScore = callGlobal("getMatchFitScore", matchMeta);
    const profileCompletenessScore = callGlobal("getMatchProfileCompletenessScore", student);
    const score = fitScore + profileCompletenessScore;

    return buildMatchEntryResult({
      student: student,
      offer: offer,
      summary: callGlobal("buildFirmQuickProfileSummaryData", offer, null),
      score: score,
      fitScore: fitScore,
      profileCompletenessScore: profileCompletenessScore,
      matchedProfession: matchMeta.matchedProfession,
      isInclusionMatch: matchMeta.isInclusionMatch,
      isAlternativeMatch: matchMeta.isAlternativeMatch,
      isActivatedAlternativeProfession: matchMeta.isActivatedAlternativeProfession,
      alternativeFamilyKey: matchMeta.alternativeFamilyKey,
      alternativeFamilyLabel: matchMeta.alternativeFamilyLabel,
      matchLabel: matchMeta.matchLabel,
      distanceKm: matchMeta.distanceKm,
      distanceLabel: matchMeta.distanceLabel,
      studentRadiusLabel: matchMeta.studentRadiusLabel,
      offerRadiusLabel: matchMeta.offerRadiusLabel,
      isVisibleMatch: matchMeta.isVisibleMatch
    });
  }

  function matchStudents(offer) {
    const context = createContext({ includeRequests: true });
    const students = context.students;
    const offers = context.offers;
    const requests = context.requests;
    if (!offer) return [];

    return students
      .map(function(student) {
        return evaluateStudentOfferMatch(student, offer, context);
      })
      .filter(function(entry) {
        return entry.isVisibleMatch && !isStudentFirmMatchSuppressed(entry.student, offer, entry.matchedProfession, requests);
      })
      .sort(function(left, right) {
        if (right.fitScore !== left.fitScore) {
          return right.fitScore - left.fitScore;
        }
        if (right.profileCompletenessScore !== left.profileCompletenessScore) {
          return right.profileCompletenessScore - left.profileCompletenessScore;
        }
        return callGlobal("compareDistanceAsc", left.distanceKm, right.distanceKm);
      });
  }

  function getMatchesForStudent(studentArg, options) {
    const config = options || {};
    const student = studentArg || null;
    const context = createContext({ offers: config.offers, requests: config.requests });
    const offers = context.offers;
    const requests = context.requests;
    if (!student) return [];

    return offers
      .map(function(offer) {
        return evaluateStudentOfferMatch(student, offer, context);
      })
      .filter(function(entry) {
        return entry.isVisibleMatch && !isStudentFirmMatchSuppressed(student, entry.offer, entry.matchedProfession, requests);
      })
      .sort(function(left, right) {
        if (right.fitScore !== left.fitScore) {
          return right.fitScore - left.fitScore;
        }
        const distanceCompare = callGlobal("compareDistanceAsc", left.distanceKm, right.distanceKm);
        if (distanceCompare !== 0) {
          return distanceCompare;
        }
        return String(left.summary.name || "").localeCompare(String(right.summary.name || ""), "de");
      });
  }

  function hasExactProfessionMatchForStudent(student, offers, options) {
    if (!callGlobal("isStudentApprenticeshipSearchActive", student)) {
      return false;
    }

    const config = options || {};
    const offerList = Array.isArray(offers) ? offers : callGlobal("loadOffers");
    return offerList.some(function(offer) {
      if (!callGlobal("isFirmApprenticeshipMatchingEnabled", offer)) {
        return false;
      }
      if (!callGlobal("getExactMatchedProfession", student, offer)) {
        return false;
      }
      if (!config.respectRadius) {
        return true;
      }
      return !!callGlobal("getMatchDistanceMeta", student, offer).isWithinRadius;
    });
  }

  window.AzubiMatchDiscovery = {
    createContext: createContext,
    buildMatchMetaResult: buildMatchMetaResult,
    buildMatchEntryResult: buildMatchEntryResult,
    getLatestFullProfileRequestForPair: getLatestFullProfileRequestForPair,
    isStudentFirmProfessionBlocked: isStudentFirmProfessionBlocked,
    isStudentFirmMatchSuppressed: isStudentFirmMatchSuppressed,
    getMatchMeta: getMatchMeta,
    evaluateStudentOfferMatch: evaluateStudentOfferMatch,
    matchStudents: matchStudents,
    getMatchesForStudent: getMatchesForStudent,
    hasExactProfessionMatchForStudent: hasExactProfessionMatchForStudent
  };
})();