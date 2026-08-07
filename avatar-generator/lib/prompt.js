/* Shared prompt composition — the single source of truth for what gets sent to
 * the image model. Loaded as a plain <script> in the browser and imported for
 * its side effect from the Node CLI; both then read globalThis.AAGPrompt.
 *
 * Keep this file free of DOM and of Node APIs.
 */
(function (root) {
  'use strict';

  function joinSentences(parts) {
    const kept = parts.filter((p) => p && String(p).trim()).map((p) => String(p).trim().replace(/\.$/, ''));
    return kept.length ? kept.join('. ') + '.' : '';
  }

  /** Rebuild the identity paragraph from identity_lock, so the card and the
   *  prompt can never disagree. Hand-editing base_prompt is not supported. */
  function renderBasePrompt(card) {
    const L = card.identity_lock || {};
    const s = L.skin || {}, h = L.hair || {}, e = L.eyes || {}, f = L.face || {}, b = L.body || {};
    const token = (card.identity_anchors && card.identity_anchors.identity_token) || String(card.id || 'AVATAR').toUpperCase();
    const marks = (L.distinguishing_marks || []).filter(Boolean);

    return joinSentences([
      `${token} — the same single person in every frame`,
      [L.apparent_age, L.heritage].filter(Boolean).join(', '),
      [s.tone && `${s.tone} skin`, s.undertone && `${s.undertone} undertone`,
        s.fitzpatrick && `Fitzpatrick ${s.fitzpatrick}`, s.texture].filter(Boolean).join(', '),
      [h.colour && `${h.colour} hair`, h.texture, h.length, h.default_styling].filter(Boolean).join(', '),
      [e.colour && `${e.colour} eyes`, e.shape, e.brows].filter(Boolean).join(', '),
      [f.shape && `${f.shape} face`, f.cheekbones, f.nose, f.mouth, f.jaw_chin].filter(Boolean).join(', '),
      marks.length ? `identifying marks that must appear in every frame: ${marks.join('; ')}` : '',
      [b.height, b.build, b.posture, b.hands].filter(Boolean).join(', '),
      L.grooming,
    ]);
  }

  function presetById(realism, id) {
    const list = (realism && realism.presets) || [];
    return list.find((p) => p.id === id) || list[0] || null;
  }

  function presetForShot(card, shot, realism) {
    const r = card.realism || {};
    const byGroup = (r.group_presets || {})[shot.group];
    return presetById(realism, byGroup || r.default_preset);
  }

  /* Slots: 'base' | 'working' | 'off-duty'. A working layer is additive by
   * definition — it goes over the base outfit rather than replacing it. */
  function wardrobeFor(card, shot) {
    const st = card.style || {};
    switch (String(shot.wardrobe || 'base')) {
      case 'working':
        return [st.wardrobe_base, st.wardrobe_working].filter(Boolean).join('; over that, ') || '';
      case 'off-duty':
        return st.wardrobe_offduty || st.wardrobe_base || '';
      default:
        return st.wardrobe_base || '';
    }
  }

  function backgroundFor(card, shot) {
    const st = card.style || {};
    const envs = st.environments || [];
    const spec = String(shot.background || '').toLowerCase();
    if (spec.includes('identity backdrop')) {
      return st.identity_backdrop || 'seamless mid-grey studio paper, evenly lit';
    }
    if (spec.includes('café') || spec.includes('cafe') || spec.includes('home')) {
      return envs[2] || envs[0] || shot.background;
    }
    if (spec.includes('workplace') || spec.includes('work environment') || spec.includes('environment')) {
      return envs[0] || shot.background;
    }
    return shot.background || '';
  }

  /**
   * Compose the full prompt for one shot.
   * @param {object} card    avatar card
   * @param {object} shot    one entry from shot-suite-20.json
   * @param {object} data    { realism } — the realism preset file
   * @param {object} [opts]  { hasReferences, extra }
   */
  function buildPrompt(card, shot, data, opts) {
    opts = opts || {};
    const realism = (data && data.realism) || {};
    const preset = presetForShot(card, shot, realism);
    const sup = realism.suppression || {};
    const neg = realism.negative_terms || [];
    const hasRefs = !!opts.hasReferences;

    const identity = (card.base_prompt && card.base_prompt.trim()) || renderBasePrompt(card);
    const mustNot = (card.identity_lock && card.identity_lock.must_not) || [];
    const distinct = card.identity_lock && card.identity_lock.distinct_from;

    const sections = [];

    sections.push('A single photorealistic photograph of one person. Photojournalistic realism — a real photograph, not a render and not an illustration.');

    sections.push('SUBJECT (identity — must be identical in every image of the set):\n' + identity);

    if (hasRefs) {
      sections.push(
        'REFERENCE IMAGES: the attached image(s) show this exact person. Reproduce her face, bone structure, ' +
        'skin tone, hair and identifying marks exactly as they appear in the reference. The reference defines WHO ' +
        'she is; the shot description below defines only the camera angle, pose, expression, wardrobe and setting. ' +
        'Do not restyle, beautify, age, slim or otherwise alter her face.'
      );
    }

    if (mustNot.length) sections.push('IDENTITY GUARDRAILS:\n- ' + mustNot.join('\n- '));
    if (distinct) sections.push('DISTINCTNESS: ' + distinct);

    const shotLines = [
      ['Framing', shot.framing],
      ['Camera', shot.camera],
      ['Head and angle', shot.head],
      ['Pose', shot.pose],
      ['Expression', shot.expression],
      ['Gaze', shot.gaze],
      ['Wardrobe', wardrobeFor(card, shot)],
      ['Setting', backgroundFor(card, shot)],
    ].filter(([, v]) => v && String(v).trim() && String(v).trim() !== 'n/a');
    sections.push('SHOT:\n' + shotLines.map(([k, v]) => `- ${k}: ${v}`).join('\n'));

    if (preset) {
      /* lighting_override is present only on the shots that genuinely modify the
       * preset's setup — mirrored keys, profile rakes, opened-up full-figure keys. */
      const light = shot.lighting_override
        ? `${preset.light}. For this shot: ${shot.lighting_override}`
        : preset.light;
      sections.push('CAPTURE AND LIGHT:\n' + [
        ['Capture', preset.capture],
        ['Light', light],
        ['Grade', preset.grade],
        ['Texture', preset.texture],
      ].filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n'));
    }

    const realismLines = [sup.skin, sup.symmetry, sup.hair, sup.colour, sup.light,
      sup.optics, sup.grade_discipline, sup.retouch_discipline, sup.output].filter(Boolean);
    if (realismLines.length) {
      sections.push('REALISM (this is what stops it reading as AI-generated):\n- ' + realismLines.join('\n- '));
    }

    if (card.realism && card.realism.extra_notes) sections.push('NOTE: ' + card.realism.extra_notes);
    if (neg.length) sections.push('AVOID: ' + neg.join(', ') + '.');

    sections.push(
      'OUTPUT: exactly one photograph of one person, filling the whole frame. Not a collage, not a grid, not a ' +
      'contact sheet, not a diptych, no split panels, no inset thumbnails, no borders, no captions, no watermark, ' +
      'no text of any kind anywhere in the image.'
    );

    if (opts.extra && String(opts.extra).trim()) {
      sections.push('ADDITIONAL DIRECTION: ' + String(opts.extra).trim());
    }

    return sections.join('\n\n');
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function outputFilename(card, shot, revision, ext) {
    return `${card.id}_r${revision}_${pad2(shot.order)}_${shot.id}.${ext}`;
  }

  root.AAGPrompt = {
    renderBasePrompt,
    buildPrompt,
    presetById,
    presetForShot,
    wardrobeFor,
    backgroundFor,
    outputFilename,
    pad2,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
