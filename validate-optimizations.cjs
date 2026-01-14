#!/usr/bin/env node

/**
 * Script de validación de optimizaciones técnicas
 * Ejecuta: node validate-optimizations.js
 */

const fs = require('fs');
const path = require('path');

const checks = {
  '404.astro existe': () => fs.existsSync('src/pages/404.astro'),
  
  'ContactForm tiene honeypot': () => {
    const content = fs.readFileSync('src/components/ContactForm.astro', 'utf-8');
    return content.includes('name="website"') && content.includes('honeypot');
  },
  
  'ContactForm tiene rate limiting': () => {
    const content = fs.readFileSync('src/components/ContactForm.astro', 'utf-8');
    return content.includes('lastSubmitKey') && content.includes('5000');
  },
  
  'API contacto tiene rate limiting': () => {
    const content = fs.readFileSync('src/pages/api/contact.ts', 'utf-8');
    return content.includes('RATE_LIMIT') && content.includes('429');
  },
  
  'API contacto valida email': () => {
    const content = fs.readFileSync('src/pages/api/contact.ts', 'utf-8');
    return content.includes('emailRegex') || content.includes('@');
  },
  
  'API contacto limita tamaño de mensaje': () => {
    const content = fs.readFileSync('src/pages/api/contact.ts', 'utf-8');
    return content.includes('5000') && content.includes('message.length');
  },
  
  'Documentación técnica existe': () => {
    return fs.existsSync('OPTIMIZACIONES_TECNICAS.md');
  },
};

console.log('\n🔍 Validando optimizaciones técnicas...\n');

let passed = 0;
let failed = 0;

Object.entries(checks).forEach(([name, check]) => {
  try {
    const result = check();
    const status = result ? '✅' : '❌';
    console.log(`${status} ${name}`);
    if (result) passed++;
    else failed++;
  } catch (e) {
    console.log(`❌ ${name} (Error: ${e.message})`);
    failed++;
  }
});

console.log(`\n📊 Resultado: ${passed} pasadas, ${failed} fallidas\n`);

if (failed === 0) {
  console.log('✨ ¡Todas las optimizaciones están implementadas!\n');
  process.exit(0);
} else {
  console.log('⚠️  Algunas validaciones fallaron. Revisa los archivos.\n');
  process.exit(1);
}
