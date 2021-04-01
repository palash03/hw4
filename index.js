
let driver =  require('./lib/driver');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

let args = process.argv.slice(2);
if( args.length != 2 )
{
    console.log( chalk.red("Usage: <priority|flaky> <testsuite_dir>"));
    return;
}
const cmd = args[0];
const testsuite = path.join(process.cwd(), args[1]);

( async () => {

    if( cmd == 'priority' ) {

        await driver.calculateTestPriority(testsuite);
    }
    else if( cmd == 'flaky' ) {

        await driver.calculateFlakyTests(testsuite, 10);
    }
    else {
        console.log( chalk.red("Usage: <priority|flaky> <testsuite_dir>"))
    }

})();

