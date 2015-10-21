/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    //When executed from command line like "grunt test -p=foo", only the tests in files like *foo*.ts will be executed
    var testFilePattern = grunt.option('p');

    grunt.initConfig({
        clean: {
            build: ["wwwroot/script"],
            tests: ["temp"]
        },

        //Reference: https://www.npmjs.com/package/grunt-ts and https://github.com/Microsoft/TypeScript/wiki/Compiler-Options
        //Another option is to manually call tsc compiler as in:
        //  node .\node_modules\grunt-ts\node_modules\typescript\bin\tsc.js .\TypeScript\test\fooTest.ts --sourcemap --target ES5 --outDir .\TypeScript\temp\
        //  for providing the list of source ts files, use something like: grunt.file.expand(['TypeScript/test/**/*.ts']).join(" ")
        ts: {
            default: {
                src: ['src/**/*.ts'],
                dest: 'wwwroot/script/',                
            },
            tests: {
                src: [testFilePattern ? 'test/**/*' + testFilePattern + '*.ts' : 'test/**/*.ts'],
                dest: 'temp/'
            },
            options: {
                target: 'es5',
                sourceMap: true,
                declaration: false,
                fast: 'never'
            }
        },

        //Copies test html files from test/**/*.html to temp folder
        copy: {
            tests: {
                expand: true,
                cwd: 'test/',
                src: [testFilePattern ? '**/*' + testFilePattern + '*.html' : '**/*.html'],
                dest: 'temp/test/',
                filter: 'isFile',
            },
        },

        qunit: {
            all: ['temp/test/**/*.html'],
            options: {
                timeout: 5000,
            },
        },
    });

    grunt.registerTask("test", ["clean:tests", "ts:tests", "copy:tests", "qunit:all"]);
    grunt.registerTask("default", ["clean:build", "ts"]);
};