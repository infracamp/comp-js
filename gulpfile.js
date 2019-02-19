
const { src, dest, parallel, task } = require('gulp');
const gulp = require("gulp");
const { watch } = require("gulp-watch");
const concat = require('gulp-concat');

/*
function html() {
    return src('client/templates/*.pug')
        .pipe(pug())
        .pipe(dest('build/html'))
}


 */
function css() {
    return src('src/*.css')
        .pipe(concat('compjs.css'))
        .pipe(dest('www/dist'))
        .pipe(dest('dist'))
}

function js() {
    return src('src/*.js', { sourcemaps: true })
        .pipe(concat('compjs.js'))
        .pipe(dest('www/dist', { sourcemaps: true }))
        .pipe(dest('dist', { sourcemaps: true }))
}

exports.js = js;
exports.css = css;
//exports.html = html;
exports.default = parallel(js, css);

task("watch", function () {
    gulp.watch("src/*.*", exports.default)
})
