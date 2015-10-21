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
        qunit: {
            all: ['temp/test/**/*.html'],
            options: {
                timeout: 5000,
            },
        },

        scaffoldQunit: {
            tests: {
                templateHtmlFile: 'test/template.html',
                testsRootFolder: 'test/',
                testLibraries: [
                    'wwwroot/lib/qunit/index.js',
                    'wwwroot/lib/sinon/index.js',
                    'wwwroot/lib/sinon-qunit/index.js',
                    'wwwroot/lib/jquery/dist/jquery.js'
                ],
                files: [
                    {
                        expand: true,           // Enable dynamic expansion.
                        cwd: 'test/',           // Src matches are relative to this path.
                        src: [                  // Actual pattern(s) to match.
                            testFilePattern ? '**/*' + testFilePattern + '*.ts' : '**/*.ts'
                        ],
                        dest: 'temp/test/',     // Destination path prefix.
                        ext: '.html',           // Dest filepaths will have this extension.
                        extDot: 'last'          // Extensions in filenames begin after the last dot
                    },
                ],
            }
        }
    });

    //Custom task for generating qunit html files from the test .ts files
    //References of help: 
    //  Node path library: https://nodejs.org/api/path.html   
    //  Creating tasks in grunt: http://gruntjs.com/creating-tasks and http://gruntjs.com/api/inside-tasks
    //  Files array format in grunt: http://gruntjs.com/configuring-tasks#files-array-format
    //  Handlebars docs: http://handlebarsjs.com/expressions.html
    grunt.registerMultiTask('scaffoldQunit', 'Create QUnit html files', function () {
        var path = require('path');
        var handlebars = require('handlebars'); //package.json has to include handlebars as devDependency

        var dependenciesMap = {},
            filesInTestFolderThatAreNotTests = [],
            testLibraries = this.data.testLibraries,
            testsRootFolder = path.normalize(this.data.testsRootFolder);

        //Regex for reference statements in ts files, example:  ///reference=../src/foo.ts
        var referencesRegex = /\/\/\/\s*<reference path="([\w_.\/]+)\.ts"/gmi;

        //Function for extracting dependencies of a given file
        var extractDependencies = function (tsFilePath) {
            if (dependenciesMap[tsFilePath]) return dependenciesMap[tsFilePath];

            //get all reference statements
            var tsFileContents = grunt.file.read(tsFilePath);
            referenceStatements = [];
            while ((referenceMatch = referencesRegex.exec(tsFileContents)) !== null) {
                reference = referenceMatch[1];
                if (path.extname(reference) == '.d') continue; //exclude declaration files

                referenceStatements.push(path.normalize(reference));
            }

            //add each reference to the current file dependencies and recursively get references
            var currentTsFileDependencies = [];
            var tsFileContainerFolder = path.dirname(tsFilePath);
            referenceStatements.forEach(function (reference) {
                //add a dependency for this reference statement (A dependency to the compiled JS file)
                currentTsFileDependencies.push(reference + '.js');
                var dependencyTsFile = path.join(tsFileContainerFolder, reference + ".ts");

                //if the file is in the test folder, then it is not a test (as test files won´t be referenced by other files)
                if (dependencyTsFile.indexOf(testsRootFolder) === 0) {
                    filesInTestFolderThatAreNotTests.push(dependencyTsFile);
                }

                //recursively extract more dependencies                 
                dependenciesMap[dependencyTsFile] = extractDependencies(dependencyTsFile);

                //Include the recursive dependencies into the map for the original file
                var dependencyRelativeFolder = path.dirname(reference);
                dependenciesMap[dependencyTsFile].forEach(function (recursiveDependency) {
                    //path for recursive dependencies have to be relative to the first dependency
                    var resolvedRecursiveDependency = path.join(dependencyRelativeFolder, recursiveDependency);
                    currentTsFileDependencies.push(resolvedRecursiveDependency);
                });
            });

            return currentTsFileDependencies;
        };

        //Iterate over every input test ts files, creating the dependency map
        this.files.forEach(function (testFile) {
            var tsFilePath = path.normalize(testFile.src);
            dependenciesMap[tsFilePath] = extractDependencies(tsFilePath);
        });

        //Compile the template html into a handlebars template
        var htmlTemplate = handlebars.compile(grunt.file.read(this.data.templateHtmlFile));

        //Use the template to create the html file for each test, including its dependencies        
        this.files.forEach(function (testFile) {
            var tsFilePath = path.normalize(testFile.src);

            if (filesInTestFolderThatAreNotTests.indexOf(tsFilePath) > -1) return;

            var jsonData = {
                htmlFileName: path.normalize(testFile.dest),
                testFileName: path.basename(tsFilePath, '.ts'),
                dependencies: dependenciesMap[tsFilePath],
                //Libraries in the wwwroot folder need a relative path from the test destination folder
                testLibraries: testLibraries.map(function (testLibrary) {
                    return path.relative(path.dirname(testFile.dest), testLibrary);
                }),
                //Pass wwwroot path, forcing it with the '/' separator
                wwwrootPath: path.relative(path.dirname(testFile.dest), 'wwwroot')
                                 .replace(new RegExp('\\' + path.sep, 'g'), '/')
            }

            grunt.file.write(jsonData.htmlFileName, htmlTemplate(jsonData));
            grunt.log.writeln('Scaffolded ' + tsFilePath + ' with html file "' + jsonData.htmlFileName);
        });
    });

    grunt.registerTask("test", ["clean:tests", "ts:tests", "scaffoldQunit:tests", "qunit:all"]);
    grunt.registerTask("default", ["clean:build", "ts"]);
};