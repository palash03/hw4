var fs = require('fs'),
    xml2js = require('xml2js'),
    child  = require('child_process'),
    chalk = require('chalk');
var parser = new xml2js.Parser();
var Bluebird = require('bluebird');
const { fail } = require('assert');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');


function getTestReport(testdir) {
    // '/simplecalc/target/surefire-reports/TEST-com.github.stokito.unitTestExample.calculator.CalculatorTest.xml';

    let testReportBase = `${testdir}/target/surefire-reports/`;
    const files = fs.readdirSync(testReportBase);
 
    const filename = files.find((file) => {
      // return the first xml file in directory
      return file.includes('.xml');
    });

    console.log( chalk.green(`Found test report ${filename}`) );
    return testReportBase + filename;
}

async function getTestResults(testReport)
{
    var contents = fs.readFileSync(testReport)
    let xml2json = await Bluebird.fromCallback(cb => parser.parseString(contents, cb));
    let tests = readMavenXmlResults(xml2json);
    return tests;
}

async function calculateTestPriority(testsuite_dir)
{
    try {

        return new Promise( function(resolved, rejected) 
        {
            let mvn = child.exec('mvn test', {cwd: testsuite_dir});
            mvn.stdout.pipe( process.stdout );
            mvn.stderr.pipe( process.stderr );

            mvn.once('exit', async (exitCode) => 
            {
                let testReport = getTestReport(testsuite_dir);
                let tests = await getTestResults(testReport);
                tests.forEach( e => console.log(e));

                resolved();
            });
        });


    } catch(e) {
        console.log( chalk.red(`Error: Calculating priority of tests:\n`) + chalk.grey(e.stack));
    }
}

async function calculateFlakyTests(testsuite_dir, iterations)
{
    try{
        var dict = {}
        for( var i = 0; i < iterations; i++ )
        {
            child.exec('mvn test', {cwd: testsuite_dir});

            let testReport = getTestReport(testsuite_dir);
            let tests = await getTestResults(testReport);
            //tests.forEach( e => console.log(i, e));
            tests.forEach(function(test){
                if (test.name in dict)
                {
                    if (test.status == "passed"){
                        dict[test.name].push(1);
                    }
                    else{
                        dict[test.name].push(-1);
                    }
                }
                else{
                    if (test.status == "passed"){
                        dict[test.name] = [1];
                    }
                    else{
                        dict[test.name] = [-1];
                    }
                }
            });
        }
        //console.log(dict);
        var res = {}
        for (let key in dict){
            var c1 = 0, c2 = 0;
            for (var i=0;i<dict[key].length;i++){
                if (dict[key][i] == 1){
                    c1 += 1;
                }
                else{
                    c2 += 1;
                }
            }
            if (c1 < c2){
                res[key] = c1/dict[key].length;
            }
            else{
                res[key] = c2/dict[key].length;
            }
        }
        console.log(res);
    } catch(e) {
        console.log( chalk.red(`Error: Calculating flaky tests:\n`) + chalk.grey(e.stack));
    }
}


function readMavenXmlResults(result)
{
    var tests = [];
    var fails = [];
    var pass = [];

    for( var i = 0; i < result.testsuite['$'].tests; i++ )
    {
        var testcase = result.testsuite.testcase[i];
        if (testcase.hasOwnProperty('failure'))
        {
            fails.push(testcase['$']);
        }
        else
        {
            pass.push(testcase['$']);
        }
    }
    pass.sort(function (a, b) {
        return a.time - b.time;
      });    
    for (var i=0;i<fails.length;i++)
    {
        var testcase = fails[i];
        tests.push({
            name:   testcase.name, 
            time:   testcase.time, 
            status: "failed"
            });
    }
    for (var i=0;i<pass.length;i++)
    {
        testcase = pass[i];
        tests.push({
            name:   testcase.name, 
            time:   testcase.time, 
            status: "passed"
            });
    }
    return tests;
}

module.exports.calculateFlakyTests = calculateFlakyTests;
module.exports.calculateTestPriority = calculateTestPriority;