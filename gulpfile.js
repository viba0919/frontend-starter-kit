/*
 ******************************************************
 *  Variables
 ******************************************************
 */

var production = false,

    root = './',

    dirPublic         = root + 'public/',
    dirPublicCss      = dirPublic + 'css/',
    dirPublicJs       = dirPublic + 'js/',

    dirSource            = root + 'resources/',
    dirSourceCss         = dirSource + 'css/',
    dirSourceSass        = dirSource + 'sass/',
    dirSourceJs          = dirSource + 'js/',
    dirSourceJade        = dirSource + 'jade/',
    dirSourceJsUtilities = dirSourceJs + 'utilities/',
    dirSourceVendor       = dirSource + 'vendor/',

    filename = {
        css: {
            main: 'app.css',
            sass: 'sass.css'
        },
        js: {
            head: 'app.head.js',
            main: 'app.js'
        }
    },

    configCss = {
        concat: [
            // ---> Add path to new plugin .css file here
            dirSourceCss + filename.css.sass
        ],
        lint: [
            dirSourceSass + '**/*.scss'
        ]
    },

    configJade = [
        dirSource + 'jade/*.jade'
    ],

    configJs = {
        concat: {
            main: [
                // Vendors
                dirSourceVendor + 'jquery/dist/jquery.js',
                dirSourceVendor + 'bootstrap-sass/assets/javascripts/bootstrap.js',
				// ---> Add path to new plugin .js file here

                // Utilities
                dirSourceJsUtilities + '**/*.js'
            ]
        },
        lint: [
            dirSourceJs + '**/*.js',
            '!node_modules/**'
        ]
    },

    onError = function(err) {
        notify.onError({
            title: "Gulp",
            message: "Error: <%= error.message %>"
        })(err);

        this.emit('end');
    },

    options = {
        autoprefixer: {
            browsers: ['last 2 versions', '> 5%']
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
        jade: {
            pretty: true
        }
    },

    watch = {
        sass: [
            dirSourceSass + '**/*.scss'
        ],
        js: [
            dirSourceJsUtilities + '**/*.js'
        ],
        jade: [
            dirSourceJade + '**/*.jade'
        ]
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
    gulpIf       = require('gulp-if'),
    prettify     = require('gulp-jsbeautifier'),
    notify       = require('gulp-notify'),
    plumber      = require('gulp-plumber'),
    rename       = require('gulp-rename'),
    sass         = require('gulp-sass'),
    sassLint     = require('gulp-sass-lint'),
    uglify       = require('gulp-uglify'),
    runSequence  = require('run-sequence'),
    jade         = require('gulp-jade');



/*
 ******************************************************
 *  Generates CSS file
 ******************************************************
 */
gulp.task('concat-css', function () {
    return gulp.src(configCss.concat)
        .pipe(concatCss(filename.css.main, {
            rebaseUrls: false
        }))
        .pipe(gulpIf(production, minifyCSS(), cssBeautify(options.cssBeautify)))
        .pipe(gulp.dest(dirPublicCss));
});

gulp.task('compile-sass', function () {
    return gulp.src(dirSourceSass + '*.scss')
        .pipe(plumber(options.plumber))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(options.autoprefixer))
        .pipe(gulp.dest(dirSourceCss));
});

gulp.task('lint-sass', function () {
    return gulp.src(configCss.lint)
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
    return gulp.src(configJs.concat.main)
        .pipe(plumber(options.plumber))
        .pipe(concat(filename.js.main))
        .pipe(gulpIf(production, uglify(), prettify(options.prettify)))
        .pipe(gulp.dest(dirPublicJs));
});

gulp.task('lint-js', function () {
    return gulp.src(configJs.lint)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});



/*
 ******************************************************
 *  Jade
 ******************************************************
 */
gulp.task('compile-jade', function() {
    gulp.src(configJade)
        .pipe(plumber(options.plumber))
        .pipe(jade(options.jade))
        .pipe(gulp.dest(dirPublic))
});



/*
 ******************************************************
 *  General
 ******************************************************
 */
gulp.task('lint', function() {
    return runSequence('lint-sass', 'lint-js');
});


gulp.task('build-dev', function() {
    return runSequence(
        ['compile-sass', 'concat-js', 'compile-jade'],
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
gulp.task('watch', ['build-dev'], function () {
    gulp.watch(watch.sass, function() {
        runSequence('compile-sass', 'concat-css');
    });

    gulp.watch(watch.js, function() {
        runSequence('concat-js');
    });

    gulp.watch(watch.jade, function() {
        runSequence('compile-jade');
    });
});