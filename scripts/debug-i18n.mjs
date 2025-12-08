import i18n from '../src/i18n.js';

console.log('language:', i18n.language);
console.log('resources keys:', Object.keys(i18n.store?.data || {}));

const companies = i18n.store?.data?.translation?.companies;
console.log('companies present:', !!companies);
console.log('companies keys:', companies ? Object.keys(companies) : null);

// Examples
console.log("t('companies.publicInfoTab') =>", i18n.t('companies.publicInfoTab'));
console.log("exists('companies.publicInfoTab') =>", i18n.exists('companies.publicInfoTab'));

// Exit
process.exit(0);
