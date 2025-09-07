#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchHtml(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 3000, path }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchStatus(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 3000, path }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    }).on('error', reject);
  });
}

(async () => {
  const server = spawn('npx', ['next', 'dev', '-p', '3000'], { stdio: 'inherit' });
  await wait(5000);
  try {
    const rootHtml = await fetchHtml('/');
    const clipHtml = await fetchHtml('/clip/test');

    if (!rootHtml.includes('<title>')) {
      throw new Error('Root page missing title');
    }
    if (!rootHtml.includes('meta name="description"')) {
      throw new Error('Root page missing meta description');
    }
    if (!clipHtml.includes('og:image')) {
      throw new Error('Clip page missing og:image');
    }
    if (!clipHtml.includes('thumbnail')) {
      throw new Error('Clip page missing thumbnail meta');
    }
    if (!clipHtml.includes('meta name="description"')) {
      throw new Error('Clip page missing meta description');
    }
    if (!rootHtml.includes('rel="canonical"')) {
      throw new Error('Root page missing canonical link');
    }
    if (!clipHtml.includes('rel="canonical"')) {
      throw new Error('Clip page missing canonical link');
    }
    if (!rootHtml.includes('meta name="robots"')) {
      throw new Error('Root page missing robots meta');
    }
    if (!clipHtml.includes('meta name="robots"')) {
      throw new Error('Clip page missing robots meta');
    }
    const robotsStatus = await fetchStatus('/robots.txt');
    if (robotsStatus !== 200) {
      throw new Error('robots.txt missing');
    }
    const sitemapStatus = await fetchStatus('/sitemap.xml');
    if (sitemapStatus !== 200) {
      throw new Error('sitemap.xml missing');
    }
    if (!clipHtml.includes('application/ld+json')) {
      throw new Error('Clip page missing JSON-LD');
    }

    console.log('SEO checks passed');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
})();
