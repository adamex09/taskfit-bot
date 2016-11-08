'use strict';

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const rollup = require('gulp-rollup');
const rollupConfig = require('./rollup.config');

gulp.task('js', () => {
  gulp.src('src/*.js')
    .pipe(plumber())
    .pipe(rollup(rollupConfig))
    .pipe(gulp.dest('build/'));
});

gulp.task('watch', () => {
  gulp.watch('src/*.js', ['js']);
});


gulp.task('default', ['js', 'watch']);
