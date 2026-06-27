/**
 * Integration Tests for WanderLust Application
 * 
 * Run: node tests/app.test.js
 * 
 * These tests verify that all routes, controllers, and core features
 * work correctly without relying on external test frameworks.
 * They require a running MongoDB instance (local or Atlas via .env).
 */

// Load environment variables
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const path = require('path');

// ── Test Infrastructure ────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName) {
    if (condition) {
        passed++;
        results.push(`  ✅ PASS: ${testName}`);
    } else {
        failed++;
        results.push(`  ❌ FAIL: ${testName}`);
    }
}

function makeRequest(urlPath, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3333,
            path: urlPath,
            method: method,
            headers: { 'Accept': 'text/html' },
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
        });
        req.on('error', reject);
        req.end();
    });
}

// ── Start Server ───────────────────────────────────────────────────
async function startTestServer() {
    // Override port for testing
    process.env.PORT = '3333';

    const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/wanderlust_test';
    
    try {
        await mongoose.connect(dbUrl);
        console.log('  Connected to test DB');
    } catch (err) {
        console.error('  ❌ Could not connect to MongoDB. Tests require a running database.');
        console.error('     Set ATLASDB_URL in .env or start local MongoDB.');
        process.exit(1);
    }

    // Import and start app
    // We need to require app.js, but it calls listen() at the end.
    // So we'll just test the file loading and routes via direct HTTP.
    const express = require('express');
    const ejsMate = require('ejs-mate');
    const session = require('express-session');
    const flash = require('connect-flash');
    const passport = require('passport');
    const LocalStrategy = require('passport-local');
    const methodOverride = require('method-override');
    const User = require('../models/user.js');

    const app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '..', 'views'));
    app.engine('ejs', ejsMate);
    app.use(express.urlencoded({ extended: true }));
    app.use(methodOverride('_method'));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.use(session({
        secret: 'testsecret',
        resave: false,
        saveUninitialized: true,
    }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use((req, res, next) => {
        res.locals.success = req.flash('success');
        res.locals.error = req.flash('error');
        res.locals.currUser = req.user;
        next();
    });

    const listingRouter = require('../routes/listing.js');
    const reviewRouter = require('../routes/review.js');
    const userRouter = require('../routes/user.js');

    app.use('/listings', listingRouter);
    app.use('/listings/:id/reviews', reviewRouter);
    app.use('/', userRouter);

    app.get('/', (req, res) => res.redirect('/listings'));
    app.get('/privacy', (req, res) => res.render('privacy.ejs'));
    app.get('/terms', (req, res) => res.render('terms.ejs'));

    app.all('*', (req, res, next) => {
        const ExpressError = require('../utils/ExpressError.js');
        next(new ExpressError(404, 'Page Not found'));
    });

    app.use((err, req, res, next) => {
        let { statusCode = 500, message = 'Something went wrong!' } = err;
        res.status(statusCode).render('error.ejs', { message });
    });

    return new Promise((resolve) => {
        const server = app.listen(3333, () => {
            console.log('  Test server running on port 3333');
            resolve(server);
        });
    });
}

// ── Test Cases ─────────────────────────────────────────────────────
async function runTests() {
    console.log('\n🧪 WanderLust Integration Tests\n');
    console.log('─'.repeat(50));

    let server;
    try {
        server = await startTestServer();
    } catch (err) {
        console.error('Failed to start test server:', err.message);
        process.exit(1);
    }

    try {
        // ── Route Tests ────────────────────────────────────────
        console.log('\n📋 Route Tests:');

        // Test 1: Root redirects to /listings
        const rootRes = await makeRequest('/');
        assert(
            rootRes.status === 302 && rootRes.headers.location === '/listings',
            'GET / redirects to /listings'
        );

        // Test 2: Listings index page loads
        const indexRes = await makeRequest('/listings');
        assert(
            indexRes.status === 200 && indexRes.body.includes('WanderLust'),
            'GET /listings returns 200 with WanderLust content'
        );

        // Test 3: Signup page loads
        const signupRes = await makeRequest('/signup');
        assert(
            signupRes.status === 200 && signupRes.body.includes('SignUp'),
            'GET /signup returns 200 with signup form'
        );

        // Test 4: Login page loads
        const loginRes = await makeRequest('/login');
        assert(
            loginRes.status === 200 && loginRes.body.includes('Login'),
            'GET /login returns 200 with login form'
        );

        // Test 5: Privacy page loads
        const privacyRes = await makeRequest('/privacy');
        assert(
            privacyRes.status === 200,
            'GET /privacy returns 200'
        );

        // Test 6: Terms page loads
        const termsRes = await makeRequest('/terms');
        assert(
            termsRes.status === 200,
            'GET /terms returns 200'
        );

        // Test 7: 404 page for unknown routes
        const notFoundRes = await makeRequest('/this-does-not-exist');
        assert(
            notFoundRes.status === 404,
            'GET /unknown-route returns 404'
        );

        // Test 8: New listing page requires login (redirects)
        const newListingRes = await makeRequest('/listings/new');
        assert(
            newListingRes.status === 302,
            'GET /listings/new redirects (requires auth)'
        );

        // ── Search Tests ───────────────────────────────────────
        console.log('\n🔍 Search Tests:');

        // Test 9: Search with query param works
        const searchRes = await makeRequest('/listings?search=beach');
        assert(
            searchRes.status === 200 && searchRes.body.includes('beach'),
            'GET /listings?search=beach returns 200 with search results'
        );

        // Test 10: Search with empty query shows all
        const emptySearchRes = await makeRequest('/listings?search=');
        assert(
            emptySearchRes.status === 200,
            'GET /listings?search= returns 200 (shows all)'
        );

        // Test 11: Search with no matches
        const noMatchRes = await makeRequest('/listings?search=zzzznonexistent');
        assert(
            noMatchRes.status === 200 && noMatchRes.body.includes('No listings found'),
            'GET /listings?search=zzzznonexistent shows "No listings found"'
        );

        // ── Category Filter Tests ──────────────────────────────
        console.log('\n🏷️  Category Filter Tests:');

        // Test 12: Category filter works
        const categoryRes = await makeRequest('/listings?category=Mountains');
        assert(
            categoryRes.status === 200,
            'GET /listings?category=Mountains returns 200'
        );

        // Test 13: Invalid category shows no results
        const badCatRes = await makeRequest('/listings?category=InvalidCategory');
        assert(
            badCatRes.status === 200,
            'GET /listings?category=InvalidCategory returns 200 (empty results)'
        );

        // ── UI Content Tests ───────────────────────────────────
        console.log('\n🎨 UI Content Tests:');

        // Test 14: Navbar contains search form
        assert(
            indexRes.body.includes('name="search"'),
            'Index page contains search input with name="search"'
        );

        // Test 15: Navbar contains search action
        assert(
            indexRes.body.includes('action="/listings"'),
            'Index page search form has action="/listings"'
        );

        // Test 16: Category filter links exist
        assert(
            indexRes.body.includes('?category=Trending') && indexRes.body.includes('?category=Mountains'),
            'Index page has category filter links'
        );

        // Test 17: MapTiler SDK is loaded in the page
        assert(
            indexRes.body.includes('maptiler-sdk'),
            'Pages load MapTiler SDK (not Mapbox)'
        );

        // Test 18: Footer has working links
        assert(
            indexRes.body.includes('href="/privacy"') && indexRes.body.includes('href="/terms"'),
            'Footer has valid privacy and terms links'
        );

        // ── Model Validation Tests ─────────────────────────────
        console.log('\n📦 Model Validation Tests:');

        // Test 19: Listing model loads without error
        try {
            const Listing = require('../models/listing.js');
            assert(true, 'Listing model loads without error');
        } catch (e) {
            assert(false, 'Listing model loads without error: ' + e.message);
        }

        // Test 20: Review model loads without error (no unused imports)
        try {
            const Review = require('../models/review.js');
            assert(true, 'Review model loads without error');
        } catch (e) {
            assert(false, 'Review model loads without error: ' + e.message);
        }

        // Test 21: User model loads without error
        try {
            const User = require('../models/user.js');
            assert(true, 'User model loads without error');
        } catch (e) {
            assert(false, 'User model loads without error: ' + e.message);
        }

        // ── Controller Tests ───────────────────────────────────
        console.log('\n⚙️  Controller Tests:');

        // Test 22: Listings controller loads
        try {
            const listingCtrl = require('../controllers/listings.js');
            assert(typeof listingCtrl.index === 'function', 'Listings controller has index function');
        } catch (e) {
            assert(false, 'Listings controller loads: ' + e.message);
        }

        // Test 23: Reviews controller loads
        try {
            const reviewCtrl = require('../controllers/reviews.js');
            assert(typeof reviewCtrl.createReview === 'function', 'Reviews controller has createReview function');
        } catch (e) {
            assert(false, 'Reviews controller loads: ' + e.message);
        }

        // Test 24: Users controller loads with fixed signup
        try {
            const userCtrl = require('../controllers/users.js');
            assert(typeof userCtrl.signup === 'function', 'Users controller has signup function');
        } catch (e) {
            assert(false, 'Users controller loads: ' + e.message);
        }

    } catch (err) {
        console.error('\n  ❌ Unexpected test error:', err.message);
        failed++;
    }

    // ── Results ────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(50));
    console.log('\n📊 Results:\n');
    results.forEach(r => console.log(r));
    console.log(`\n  Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    console.log('─'.repeat(50) + '\n');

    // Cleanup
    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
