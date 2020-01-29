const express = require('express');
const app = express();

// 1.
app.use((req, res, next) => {
    console.log('\n\nALWAYS');
    next();
});

// 2.
app.get('/a', (req, res) => {
    console.log('GET /a: route terminated');
    res.send('a');
});


// 3.
app.get('/a', (req, res) => {
    console.log('GET /a: should never be called');
});

// 4.
app.get('/b', (req, res, next) => {
    console.log('GET /b: route not terminated');
    next();
});

// 5.
app.use((req, res, next) => {
    console.log('USE: SOMETIMES');
    next();
});

// 6.
app.get('/b', (req, res, next) => {
    console.log('GET /b: throwing error');
    throw new Error('b failed');
});

// 7.
app.use('/b', (err, req, res, next) => {
    console.log('USE /b: error detected and passed on');
    next(err);
});

// 8.
app.get('/c', (err, req) => {
    console.log('GET /c: throwing error');
    throw new Error('c failed');
});

// 9.
app.use('/c', (err, req, res, next) => {
    console.log('USE /c: error detected - not passed on');
    next();
});

// 9.1
app.get('/c', (req, res, next) => {
    console.log('GET /c: after error thrown');
    next();
});

// 10
app.use((err, req, res, next) => {
    console.log('unhandled error detected: ' + err.message);
    res.send('500 - server error');
});

// 11
app.use((req, res) => {
    console.log('unhandled route');
    res.send('404 - not found');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`started on ${port}`);
});

/*
 * BEHAVIOR:
 * 
 * -  The first middleware will always be called.
 * -  If the URL is '/a' it will match [2] and the request is terminated.
 * -  If the URL is not '/a', then [5] will always run
 * 
 * -  If the URL is '/b', then [6] will throw an error. [7] is a middleware
 *    that *only* catches errors thrown if URL is '/b'. However, [7] does
 *    not terminate, and passed the error on.
 * -  If the URL is '/b', the error thrown will be caught by [10].
 * 
 * -  If the URL is '/c', then [8] throws an error. The error handler
 *    in [9] catches the error but doesn't pass it on since nothing
 *    is handed to next().
 * -  Since the error was caught but not passed on, the route handler in [9.1]
 *    will run, but not terminate the req since it called next.
 * -  NOTE: Even though 9.1 did handle it, it did not terminate the request, and
 *    as such, since there is no error (it was caught), the final handler is the 404
 *    which will return a 404.
 * 
 * -  So:
 *    |     |  
 *    |  /  | ALWAYS -> SOMETIMES -> 404
 *    |  /a | ALWAYS -> GET /a
 *    |  /b | ALWAYS -> SOMETIMES -> GET /b --err--> USE /b -> 500
 *    |  /c | ALWAYS -> SOMEITMES -> GET /c --err--> USE /c -> GET /c -> 404 
 * 
 * INSIGHTS
 * - You *can* stop an error thrown earlier in the pipeline by
 *   catching it.
 * - If a route handler calls next(), the pipeline continues.
 * - You can attach middleware to a path
 * - If an error is thrown, non-error handlers are skipped until
 *   the error is caught.
 */


/*
 * The above example was taken & modified slightly from:
 * Web Development with Node and Express
 * Ethan Brown
 * ISBN-13: 978-1492053514
 * Chapter 10
 */