$(document).ready(function () {
    var storageKey = 'sparf-lab-progress:' + (document.title || location.pathname);
    var $steps = $('p.numbered');
    var totalSteps = $steps.length;
    var completed = [];
    var state = {
        completed: [],
        currentStep: null,
        lastSectionId: null,
        collapsedSections: [],
        updatedAt: null
    };

    function findScormApi(win) {
        var attempts = 0;
        while (win && attempts < 10) {
            if (win.API_1484_11) return { api: win.API_1484_11, version: '2004' };
            if (win.API) return { api: win.API, version: '1.2' };
            attempts += 1;
            if (win.parent && win.parent !== win) win = win.parent; else break;
        }
        if (window.opener && window.opener !== window) return findScormApi(window.opener);
        return null;
    }

    var scorm = (function () {
        var apiInfo = findScormApi(window);
        var initialized = false;
        var pipwerksAvailable = !!(window.pipwerks && window.pipwerks.SCORM);

        function callApi(methods) {
            if (!apiInfo) return false;
            for (var i = 0; i < methods.length; i++) {
                var method = methods[i];
                if (typeof apiInfo.api[method] === 'function') {
                    try {
                        var result = apiInfo.api[method]('');
                        return result === true || result === 'true' || result === '1' || result === 1 || result === undefined;
                    } catch (e) { return false; }
                }
            }
            return false;
        }

        function init() {
            if (initialized) return true;
            if (pipwerksAvailable && window.pipwerks.SCORM.init) {
                try { initialized = !!window.pipwerks.SCORM.init(); } catch(e) { initialized = false; }
            }
            if (!initialized && apiInfo) {
                initialized = callApi(apiInfo.version === '2004' ? ['Initialize'] : ['LMSInitialize']);
            }
            return initialized;
        }

        function get(key) {
            if (!init()) return null;
            if (pipwerksAvailable && window.pipwerks.SCORM.get) {
                try { return window.pipwerks.SCORM.get(key); } catch(e) {}
            }
            if (!apiInfo) return null;
            try {
                return apiInfo.version === '2004' ? apiInfo.api.GetValue(key) : apiInfo.api.LMSGetValue(key);
            } catch(e) { return null; }
        }

        function set(key, value) {
            if (!init()) return false;
            if (pipwerksAvailable && window.pipwerks.SCORM.set) {
                try { return !!window.pipwerks.SCORM.set(key, value); } catch(e) {}
            }
            if (!apiInfo) return false;
            try {
                var result = apiInfo.version === '2004' ? apiInfo.api.SetValue(key, String(value)) : apiInfo.api.LMSSetValue(key, String(value));
                return result === true || result === 'true' || result === '1' || result === 1;
            } catch(e) { return false; }
        }

        function save() {
            if (!init()) return false;
            if (pipwerksAvailable && window.pipwerks.SCORM.save) {
                try { return !!window.pipwerks.SCORM.save(); } catch(e) {}
            }
            if (!apiInfo) return false;
            try {
                var result = apiInfo.version === '2004' ? apiInfo.api.Commit('') : apiInfo.api.LMSCommit('');
                return result === true || result === 'true' || result === '1' || result === 1 || result === undefined;
            } catch(e) { return false; }
        }

        return {
            available: function () { return init(); },
            version: function () { return apiInfo ? apiInfo.version : null; },
            get: get,
            set: set,
            save: save
        };
    })();

    function normalizeState(raw) {
        var parsed = raw;
        if (typeof raw === 'string' && raw) {
            try { parsed = JSON.parse(raw); } catch(e) { parsed = {}; }
        }
        if ($.isArray(parsed)) parsed = { completed: parsed };
        parsed = parsed || {};
        return {
            completed: $.isArray(parsed.completed) ? parsed.completed.filter(function (n) { return typeof n === 'number' && n >= 0 && n < totalSteps; }) : [],
            currentStep: typeof parsed.currentStep === 'number' ? parsed.currentStep : null,
            lastSectionId: parsed.lastSectionId || null,
            collapsedSections: $.isArray(parsed.collapsedSections) ? parsed.collapsedSections : [],
            updatedAt: parsed.updatedAt || null
        };
    }

    function loadState() {
        var fromScorm = null;
        if (scorm.available()) {
            fromScorm = scorm.get('cmi.suspend_data') || scorm.get('cmi.core.lesson_location');
        }
        if (fromScorm) return normalizeState(fromScorm);
        try { return normalizeState(localStorage.getItem(storageKey)); }
        catch (e) { return normalizeState(null); }
    }

    function saveState() {
        state.completed = completed.slice().sort(function(a,b){return a-b;});
        state.collapsedSections = $('.section-card.collapsed').map(function () { return this.id; }).get();
        state.updatedAt = new Date().toISOString();
        var serialized = JSON.stringify(state);
        var pct = totalSteps ? Math.round((state.completed.length / totalSteps) * 100) : 0;
        var savedToScorm = false;

        if (scorm.available()) {
            savedToScorm = scorm.set('cmi.suspend_data', serialized);
            if (scorm.version() === '2004') {
                scorm.set('cmi.progress_measure', totalSteps ? (state.completed.length / totalSteps).toFixed(2) : '0');
                scorm.set('cmi.score.raw', pct);
                scorm.set('cmi.score.min', '0');
                scorm.set('cmi.score.max', '100');
                scorm.set('cmi.location', state.lastSectionId || '');
                scorm.set('cmi.completion_status', pct >= 100 ? 'completed' : 'incomplete');
            } else {
                scorm.set('cmi.core.score.raw', pct);
                scorm.set('cmi.core.lesson_location', state.lastSectionId || serialized);
                scorm.set('cmi.core.lesson_status', pct >= 100 ? 'completed' : 'incomplete');
            }
            scorm.save();
        }

        if (!savedToScorm) {
            try { localStorage.setItem(storageKey, serialized); } catch(e) {}
        }
  
    }


    state = loadState();
    completed = state.completed.slice();

    function updateProgress() {
        var done = completed.length;
        var pct = totalSteps ? Math.round((done / totalSteps) * 100) : 0;
        $('#progressBar').css('width', pct + '%').attr('aria-valuenow', pct);
        $('#progressText').text(pct + t('progressCompleted'));
        $('#stepCountText').text(done + '/' + totalSteps + ' ' + t('steps'));
        $('#heroStepCount').text(t('heroSteps', { count: totalSteps }));
        $steps.each(function (idx) {
            var isDone = completed.indexOf(idx) !== -1;
            $(this).toggleClass('done', isDone);
            $(this).find('.step-check').text(isDone ? t('notDone') : t('markAsDone'));
        });
        if (pct >= 100) $('#completionMessage').show(); else $('#completionMessage').hide();
    }

    function setCurrentStep(idx, shouldSave) {
        state.currentStep = idx;
        var $step = $steps.eq(idx);
        var $section = $step.closest('.section-card');
        if ($section.length) {
            state.lastSectionId = $section.attr('id');
            $section.removeClass('collapsed');
        }
        $steps.css('background', '').removeClass('current-step');
        $step.css('background', 'rgba(255, 171, 40, 0.18)').addClass('current-step');
        if (shouldSave !== false) saveState();
    }

    function copyText(text, labelElement) {
        var success = function () {
            if (labelElement) {
                var oldText = $(labelElement).text();
                $(labelElement).text(t('copied')).attr('aria-label', t('copiedToClipboard'));
                setTimeout(function () { $(labelElement).text(oldText).removeAttr('aria-label'); }, 1400);
            }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(success).catch(function () { fallbackCopy(text, success); });
        } else {
            fallbackCopy(text, success);
        }
    }

    function fallbackCopy(text, callback) {
        var $temp = $('<textarea>').val(text).css({position: 'fixed', left: '-9999px'}).appendTo('body');
        $temp[0].select();
        try { document.execCommand('copy'); if (callback) callback(); } catch(e) {}
        $temp.remove();
    }

    $steps.each(function (idx) {
        var $step = $(this);
        $step.attr('data-step-label', t('stepPrefix', { num: idx + 1 }));
        if (!$step.find('.step-check').length) {
            $step.append('<button type="button" class="step-check">Mark as done</button>');
        }
        $step.on('click', function (event) {
            if ($(event.target).is('button')) return;
            setCurrentStep(idx);
        });
        $step.find('.step-check').on('click', function () {
            setCurrentStep(idx, false);
            var existing = completed.indexOf(idx);
            if (existing === -1) completed.push(idx); else completed.splice(existing, 1);
            completed.sort(function(a,b){return a-b;});
            saveState();
            updateProgress();
            
            // Set current step to the first incomplete step
            var nextStep = 0;
            while (completed.indexOf(nextStep) !== -1 && nextStep < totalSteps) {
                nextStep++;
            }
            if (nextStep < totalSteps) {
                setCurrentStep(nextStep, false);
            }
        });
    });
    
    $('pre.code').each(function () {
        var $pre = $(this);
        if (!$pre.find('button.btn').length) {
            $pre.prepend('<button type="button" class="btn">' + t('copy') + '</button>');
        } else {
            $pre.find('button.btn').text(t('copy')).attr('type', 'button');
        }
        $pre.find('button.btn').off('click').on('click', function () {
            copyText($pre.find('code').text(), this);
        });
    });

    $('pre.toggle').each(function () {
        $(this).hide(0);
        if (!$(this).prev('span.toggle').length) $(this).before("<span class='toggle'>" + t('showCode') + "</span>");
    });
    $('span.toggle').off('click').on('click', function () {
        if ($(this).next().is(':hidden')) {
            $(this).text(t('hideCode'));
            $(this).next().show(300);
        } else {
            $(this).text(t('showCode'));
            $(this).next().hide(300);
        }
    });

    var $sectionNav = $('#sectionNav');
    $('.section-card').each(function (idx) {
        var $card = $(this);
        var title = $.trim($card.find('h2:first').text()) || (t('section') + ' ' + (idx + 1));
        var id = $card.attr('id') || 'section-' + (idx + 1);
        $card.attr('id', id);
        $sectionNav.append('<a href="#' + id + '">' + title + '</a>');
        $card.find('h2:first').attr('tabindex', '0').attr('title', 'Klik om sectie in of uit te klappen').on('click keydown', function (event) {
            if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                $card.toggleClass('collapsed');
                state.lastSectionId = id;
                $('#toggleAllSections').text($('.section-card.collapsed').length ? t('expandSections') : t('collapseSections'));
                saveState();
            }
        });
    });

    state.collapsedSections.forEach(function (id) { $('#' + id).addClass('collapsed'); });
    $('#toggleAllSections').text($('.section-card.collapsed').length ? t('expandSections') : t('collapseSections'));

    if (!$('.empty-state').length) {
        $('#sectionNav').after('<div class="empty-state" id="emptySearch">' + t('noSectionsFound') + '</div>');
    }

    $('#labSearch').on('input', function () {
        var query = $(this).val().toLowerCase().trim();
        var visibleCount = 0;
        $('.section-card').each(function () {
            var $card = $(this);
            var match = !query || $card.text().toLowerCase().indexOf(query) !== -1;
            $card.toggleClass('search-hidden', !match).toggleClass('search-hit', !!query && match);
            if (match) visibleCount++;
        });
        $('#emptySearch').toggleClass('visible', visibleCount === 0);
    });

    $('#toggleAllSections').on('click', function () {
        var shouldCollapse = $('.section-card.collapsed').length === 0;
        $('.section-card').toggleClass('collapsed', shouldCollapse);
        $(this).text(shouldCollapse ? t('expandSections') : t('collapseSections'));
        saveState();
    });

    $('#copyAllPrompts').on('click', function () {
        var prompts = $('pre.code code').map(function (idx) {
            return t('prompt') + ' ' + (idx + 1) + '\n' + $(this).text().trim();
        }).get().join('\n\n---\n\n');
        copyText(prompts, this);
    });

    $('#resetProgress').on('click', function () {
        completed = [];
        state.currentStep = null;
        state.lastSectionId = null;
        state.collapsedSections = [];
        $('.section-card').removeClass('collapsed');
        saveState();
        updateProgress();
    });

    $('#printLab').on('click', function () { window.print(); });

    if (!$('.back-to-top').length) $('body').append('<button type="button" class="back-to-top" aria-label="Terug naar boven">↑</button>');
    $('.back-to-top').on('click', function () { window.scrollTo({top: 0, behavior: 'smooth'}); });
    $(window).on('scroll', function () { $('.back-to-top').toggleClass('visible', window.scrollY > 600); });

    var sectionObserver = null;
    if ('IntersectionObserver' in window) {
        sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    state.lastSectionId = entry.target.id;
                    $('#sectionNav a').removeClass('active');
                    $('#sectionNav a[href="#' + entry.target.id + '"]').addClass('active');
                    saveState();
                }
            });
        }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
        $('.section-card').each(function () { sectionObserver.observe(this); });
    }

    if (window.hljs) hljs.highlightAll();
    $('#copyrightyear').text(new Date().getFullYear());
    updateProgress();


    if (state.lastSectionId && $('#' + state.lastSectionId).length) {
        $('#' + state.lastSectionId).removeClass('collapsed');
    }
    
    // Only scroll if there are completed steps
    if (completed.length > 0) {
        // Determine which step to scroll to
        var stepToScroll = state.currentStep;
        if (stepToScroll === null || stepToScroll >= totalSteps) {
            // Find first incomplete step
            stepToScroll = 0;
            while (completed.indexOf(stepToScroll) !== -1 && stepToScroll < totalSteps) {
                stepToScroll++;
            }
        }
        
        if (stepToScroll !== null && stepToScroll < totalSteps && $steps.eq(stepToScroll).length) {
            var $targetStep = $steps.eq(stepToScroll);
            if ($targetStep.length) {
                var offset = $targetStep.offset().top - $(window).scrollTop();
                var headerHeight = $('.student-tools').outerHeight() || 0;
                var targetPosition = $targetStep.offset().top - headerHeight - 20;
                $('html, body').animate({
                    scrollTop: targetPosition
                }, 500);
                setCurrentStep(stepToScroll, false);
            }
        }
    }

    window.addEventListener('beforeunload', saveState);
});
