'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

var sass_path = './style/*.scss';
var public_path = './public';

gulp.task('default', ['sass']);

gulp.task('sass', function (){
	return gulp.src(sass_path)
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(public_path));
});

gulp.task('sass:watch', function (){
	gulp.watch(sass_path, ['sass']);
});
