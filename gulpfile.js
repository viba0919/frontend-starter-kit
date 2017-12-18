/*
 ******************************************************
 *  Variables
 ******************************************************
 */

var root = './',

    dirPublic         = root + 'public/',
    dirPublicCss      = dirPublic + 'css/',
    dirPublicJs       = dirPublic + 'js/',

    dirSource            = root + 'resources/',
    dirSourceCss         = dirSource + 'css/',
    dirSourceSass        = dirSource + 'sass/',
    dirSourceJs          = dirSource + 'js/',
    dirSourceJsUtilities = dirSourceJs + 'utilities/',
    dirSourcePug         = dirSource + 'pug/',

    dirNodeModules       = './node_modules/',

    fileNames = {
        css: {
            main: 'app.css',
            sass: 'sass.css'
        },
        js: {
            head: 'app.head.js',
            main: 'app.js'
        }
    },

    config = {
        port: 9090,
        devBaseUrl: 'http://192.168.56.100',
        css: {
            concat: [
                // Vendors
                dirNodeModules + 'normalize.css/normalize.css',
                // ---> Add path to new plugin .css file here

                dirSourceCss + fileNames.css.sass
            ]
        },
        sass: {
            compile: [
                dirSourceSass + '*.scss'
            ],
            lint: [
                dirSourceSass + '**/*.scss'
            ],
            watch: [
                dirSourceSass + '**/*.scss'
            ]
        },
        pug: {
            compile: [
                dirSource + 'pug/*.pug'
            ],
            watch: [
                dirSourcePug + '**/*.pug'
            ]
        },
        js: {
            concat: [
                // Vendors
                dirNodeModules + 'jquery/dist/jquery.js',
                // ---> Add path to new plugin .js file here

                dirSourceJsUtilities + '**/*.js'
            ],
            lint: [
                dirSourceJs + '**/*.js',
                '!node_modules/**'
            ],
            watch: [
                dirSourceJsUtilities + '**/*.js'
            ]
        }
    },

    onError = function(err) {
        notify.onError({
            title: "Gulp onError()",
            message: "Error: <%= error.message %>"
        })(err);

        this.emit('end');
    },

    options = {
        autoprefixer: {
            browsers: [
                'last 2 versions', '> 5%'
            ]
        },
        concatCss: {
            rebaseUrls: false
        },
        cssBeautify: {
            autosemicolon: true,
            indent: '    ',
            openbrace: 'end-of-line'
        },
        plumber: {
            errorHandler: onError
        },
        prettify: {
            'js': {
                'indent_size': 4,
                'end_with_newline': true
            }
        },
        pug: {
            pretty: true
        },
        rename: {
            suffix: '.min'
        }
    };


/*
 ******************************************************
 *  Gulp packages
 ******************************************************
 */
var gulp         = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    minifyCSS    = require('gulp-clean-css'),
    concat       = require('gulp-concat'),
    concatCss    = require('gulp-concat-css'),
    cssBeautify  = require('gulp-cssbeautify'),
    eslint       = require('gulp-eslint'),
    prettify     = require('gulp-jsbeautifier'),
    notify       = require('gulp-notify'),
    plumber      = require('gulp-plumber'),
    rename       = require('gulp-rename'),
    sass         = require('gulp-sass'),
    sassLint     = require('gulp-sass-lint'),
    uglify       = require('gulp-uglify'),
    runSequence  = require('run-sequence'),
    connect      = require('gulp-connect'),
    pug          = require('gulp-pug');



/*
 ******************************************************
 *  Generates CSS file
 ******************************************************
 */
gulp.task('concat-css', function () {
    return gulp.src(config.css.concat)
        .pipe(concatCss(fileNames.css.main, options.concatCss))
        .pipe(cssBeautify(options.cssBeautify))
        .pipe(gulp.dest(dirPublicCss))
        .pipe(minifyCSS())
        .pipe(rename(options.rename))
        .pipe(gulp.dest(dirPublicCss))
        .pipe(connect.reload());
});

gulp.task('compile-sass', function () {
    return gulp.src(config.sass.compile)
        .pipe(plumber(options.plumber))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(options.autoprefixer))
        .pipe(gulp.dest(dirSourceCss));
});

gulp.task('lint-sass', function () {
    return gulp.src(config.sass.lint)
        .pipe(sassLint())
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
});



/*
 ******************************************************
 *  Generates Javascript file
 ******************************************************
 */
gulp.task('concat-js', function() {
    return gulp.src(config.js.concat)
        .pipe(plumber(options.plumber))
        .pipe(concat(fileNames.js.main))
        .pipe(prettify(options.prettify))
        .pipe(gulp.dest(dirPublicJs))
        .pipe(uglify())
        .pipe(rename(options.rename))
        .pipe(gulp.dest(dirPublicJs))
        .pipe(connect.reload());
});

gulp.task('lint-js', function () {
    return gulp.src(config.js.lint)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});



/*
 ******************************************************
 *  Jade
 ******************************************************
 */
gulp.task('compile-pug', function() {
    gulp.src(config.pug.compile)
        .pipe(plumber(options.plumber))
        .pipe(pug(options.pug))
        .pipe(gulp.dest(dirPublic))
        .pipe(connect.reload());
});



/*
 ******************************************************
 *  Web server
 ******************************************************
 */
gulp.task('serve', ['build-dev'], function () {
    connect.server({
        root: dirPublic,
        port: config.port,
        base: config.devBaseUrl,
        livereload: true
    });
});



/*
 ******************************************************
 *  General
 ******************************************************
 */
gulp.task('lint', function() {
    return runSequence('lint-sass', 'lint-js');
});


gulp.task('build-css', function() {
    return runSequence('compile-sass', 'concat-css');
});

gulp.task('build-js', function() {
    return runSequence('concat-js');
});

gulp.task('build-html', function() {
    return runSequence('compile-pug');
});


gulp.task('build-dev', function() {
    return runSequence(
        ['compile-sass', 'concat-js', 'compile-pug'],
        'concat-css'
    );
});


gulp.task('default', function() {
    return runSequence('build-dev');
});



/*
 ******************************************************
 *  Watchers
 ******************************************************
 */
gulp.task('watch', ['serve'], function () {
    gulp.watch(config.sass.watch, function() {
        runSequence('build-css');
    });

    gulp.watch(config.js.watch, function() {
        runSequence('build-js');
    });

    gulp.watch(config.pug.watch, function() {
        runSequence('build-html');
    });
});
