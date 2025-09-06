#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Badge Generator Script
 * Generates SVG badges based on test results and coverage data
 */

class BadgeGenerator {
  constructor() {
    this.badgesDir = path.join(__dirname, '..', 'badges');
    this.templatesDir = path.join(__dirname, 'badge-templates');

    // Ensure directories exist
    if (!fs.existsSync(this.badgesDir)) {
      fs.mkdirSync(this.badgesDir, { recursive: true });
    }
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  /**
   * Get color based on percentage value
   */
  getColorForPercentage(percentage) {
    if (percentage >= 90) return '#4c1'; // Bright green
    if (percentage >= 80) return '#97ca00'; // Green
    if (percentage >= 70) return '#a4a61d'; // Yellow-green
    if (percentage >= 60) return '#dfb317'; // Yellow
    if (percentage >= 50) return '#fe7d37'; // Orange
    return '#e05d44'; // Red
  }

  /**
   * Get color for test status
   */
  getColorForStatus(status) {
    switch (status.toLowerCase()) {
      case 'passing':
      case 'passed':
        return '#4c1';
      case 'failing':
      case 'failed':
        return '#e05d44';
      default:
        return '#9f9f9f';
    }
  }

  /**
   * Calculate text width for centering
   */
  calculateTextWidth(text, fontSize = 11) {
    // Approximate character width calculation
    return text.length * fontSize * 0.6;
  }

  /**
   * Generate a badge SVG
   */
  generateBadge(label, value, color, options = {}) {
    const fontSize = options.fontSize || 11;
    const height = options.height || 20;
    const labelPadding = 10;
    const valuePadding = 10;

    const labelWidth =
      this.calculateTextWidth(label, fontSize) + labelPadding * 2;
    const valueWidth =
      this.calculateTextWidth(value, fontSize) + valuePadding * 2;
    const totalWidth = labelWidth + valueWidth;

    const labelX = labelWidth / 2;
    const valueX = labelWidth + valueWidth / 2;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${height}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${fontSize}">
    <text aria-hidden="true" x="${labelX}" y="${height - 5}" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelX}" y="${height - 6}" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${valueX}" y="${height - 5}" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${valueX}" y="${height - 6}" fill="#fff">${value}</text>
  </g>
</svg>`;
  }

  /**
   * Parse coverage summary from lcov.info or coverage-summary.json
   */
  parseCoverage() {
    try {
      // Try to read coverage summary JSON first
      const coverageSummaryPath = path.join(
        __dirname,
        '..',
        'coverage',
        'coverage-summary.json'
      );
      if (fs.existsSync(coverageSummaryPath)) {
        const coverageSummary = JSON.parse(
          fs.readFileSync(coverageSummaryPath, 'utf8')
        );
        const total = coverageSummary.total;
        return {
          lines: total.lines.pct,
          statements: total.statements.pct,
          functions: total.functions.pct,
          branches: total.branches.pct,
        };
      }

      // Fallback to parsing lcov.info
      const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov.info');
      if (fs.existsSync(lcovPath)) {
        const lcovContent = fs.readFileSync(lcovPath, 'utf8');
        const lines = lcovContent.split('\n');

        let linesFound = 0,
          linesHit = 0;
        let functionsFound = 0,
          functionsHit = 0;
        let branchesFound = 0,
          branchesHit = 0;

        lines.forEach((line) => {
          if (line.startsWith('LF:')) linesFound += parseInt(line.slice(3));
          if (line.startsWith('LH:')) linesHit += parseInt(line.slice(3));
          if (line.startsWith('FNF:'))
            functionsFound += parseInt(line.slice(4));
          if (line.startsWith('FNH:')) functionsHit += parseInt(line.slice(4));
          if (line.startsWith('BRF:')) branchesFound += parseInt(line.slice(4));
          if (line.startsWith('BRH:')) branchesHit += parseInt(line.slice(4));
        });

        return {
          lines: linesFound > 0 ? (linesHit / linesFound) * 100 : 0,
          statements: linesFound > 0 ? (linesHit / linesFound) * 100 : 0,
          functions:
            functionsFound > 0 ? (functionsHit / functionsFound) * 100 : 0,
          branches: branchesFound > 0 ? (branchesHit / branchesFound) * 100 : 0,
        };
      }

      console.warn('No coverage data found');
      return null;
    } catch (error) {
      console.error('Error parsing coverage:', error);
      return null;
    }
  }

  /**
   * Parse test results
   */
  parseTestResults() {
    try {
      // This would typically parse test output or a test results file
      // For now, we'll check if tests passed based on exit code
      const testsPassed =
        process.env.TESTS_PASSED === 'true' || !process.env.TESTS_PASSED;
      const testsCount = process.env.TESTS_COUNT || 'unknown';

      return {
        status: testsPassed ? 'passing' : 'failing',
        count: testsCount,
      };
    } catch (error) {
      console.error('Error parsing test results:', error);
      return {
        status: 'unknown',
        count: 'unknown',
      };
    }
  }

  /**
   * Generate all badges
   */
  async generateBadges() {
    console.log('Generating badges...');

    // Generate coverage badges
    const coverage = this.parseCoverage();
    if (coverage) {
      // Overall coverage badge
      const overallCoverage = Math.round(coverage.lines);
      const coverageBadge = this.generateBadge(
        'coverage',
        `${overallCoverage}%`,
        this.getColorForPercentage(overallCoverage)
      );
      fs.writeFileSync(
        path.join(this.badgesDir, 'coverage.svg'),
        coverageBadge
      );
      console.log(`✓ Generated coverage badge: ${overallCoverage}%`);

      // Individual coverage badges
      ['lines', 'statements', 'functions', 'branches'].forEach((type) => {
        const value = Math.round(coverage[type]);
        const badge = this.generateBadge(
          `coverage:${type}`,
          `${value}%`,
          this.getColorForPercentage(value)
        );
        fs.writeFileSync(
          path.join(this.badgesDir, `coverage-${type}.svg`),
          badge
        );
        console.log(`✓ Generated ${type} coverage badge: ${value}%`);
      });
    }

    // Generate test badge
    const testResults = this.parseTestResults();
    const testBadge = this.generateBadge(
      'tests',
      testResults.status,
      this.getColorForStatus(testResults.status)
    );
    fs.writeFileSync(path.join(this.badgesDir, 'tests.svg'), testBadge);
    console.log(`✓ Generated test badge: ${testResults.status}`);

    // Generate build badge
    const buildStatus = process.env.BUILD_STATUS || 'passing';
    const buildBadge = this.generateBadge(
      'build',
      buildStatus,
      this.getColorForStatus(buildStatus)
    );
    fs.writeFileSync(path.join(this.badgesDir, 'build.svg'), buildBadge);
    console.log(`✓ Generated build badge: ${buildStatus}`);

    // Generate version badge
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    const versionBadge = this.generateBadge(
      'version',
      `v${packageJson.version}`,
      '#007ec6'
    );
    fs.writeFileSync(path.join(this.badgesDir, 'version.svg'), versionBadge);
    console.log(`✓ Generated version badge: v${packageJson.version}`);

    // Generate license badge
    const licenseBadge = this.generateBadge(
      'license',
      packageJson.license || 'MIT',
      '#007ec6'
    );
    fs.writeFileSync(path.join(this.badgesDir, 'license.svg'), licenseBadge);
    console.log(`✓ Generated license badge: ${packageJson.license || 'MIT'}`);

    console.log('✅ All badges generated successfully!');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new BadgeGenerator();
  generator.generateBadges().catch(console.error);
}

module.exports = BadgeGenerator;
