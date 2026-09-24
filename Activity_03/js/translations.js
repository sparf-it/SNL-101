// Translation strings for the lab interface
// To add another language, create a new object with the same keys
const translations = {
    en: {
        progressCompleted: '% completed',
        steps: 'steps',
        heroSteps: '🧪 {count} steps',
        stepPrefix: 'Step {num}.',
        markAsDone: 'Mark as done',
        notDone: 'Not Done',
        copied: 'Copied ✓',
        copiedToClipboard: 'Copied to clipboard',
        copy: 'Copy',
        showCode: 'Show code',
        hideCode: 'Hide code',
        section: 'Section',
        expandSections: 'Expand sections',
        collapseSections: 'Collapse sections',
        noSectionsFound: 'No sections found. Clear your search term to see everything again.',
        prompt: 'Prompt',
        resetProgress: 'Reset progress',
        printLab: 'Print lab'
    },
    nl: {
        progressCompleted: '% voltooid',
        steps: 'stappen',
        heroSteps: '🧪 {count} stappen',
        stepPrefix: 'Stap {num}.',
        markAsDone: 'Markeer klaar',
        notDone: 'Niet klaar',
        copied: 'Gekopieerd ✓',
        copiedToClipboard: 'Gekopieerd naar klembord',
        copy: 'Kopieer',
        showCode: 'Toon code',
        hideCode: 'Verberg code',
        section: 'Sectie',
        expandSections: 'Secties uitklappen',
        collapseSections: 'Secties inklappen',
        noSectionsFound: 'Geen secties gevonden. Wis uw zoekterm om alles weer te zien.',
        prompt: 'Prompt',
        resetProgress: 'Voortgang resetten',
        printLab: 'Lab afdrukken'
    }
};

// Set default language from config file (can be overridden by window.labLanguage for backward compatibility)
let currentLanguage = (window.labConfig && window.labConfig.language) || window.labLanguage || 'en';

// Function to get a translation string
function t(key, replacements = {}) {
    const lang = translations[currentLanguage] || translations.en;
    let text = lang[key] || translations.en[key] || key;
    
    // Replace placeholders like {count}
    Object.keys(replacements).forEach(placeholder => {
        text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    });
    
    return text;
}

// Function to change language
function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        // Trigger a custom event to notify the page that language changed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
}
