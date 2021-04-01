# Test Suites Analysis

In this workshop, we cover the basics for analyzing test suites for effectiveness and quality.

``` | {type:'youtube'}
https://www.youtube.com/embed/_TzqrHn5Q78
```

## Setup

### Before you get started

Import this as a notebook or clone this repo locally. Also, ensure you [install latest version of docable](https://github.com/ottomatica/docable-notebooks/blob/master/docs/install.md)!

```bash
docable-server import https://github.com/CSC-DevOps/TestSuites
```

If your local environment does not have Java + node.js, you will want to create 
a virtual environment for workshop, using the provided bakerx.yml.

```bash | {type:'command', stream: true, failed_when: 'exitCode!=0'}
bakerx run
```

## Code tour

> Note: You can ssh into the virtual machine using `bakerx ssh testsuites`. Workshop materials will be mounted in `/bakerx`.

#### Inspecting the Test Suite

Inside the `simplecalc/src/test` directory (package namespace elided) you will see a CalculatorTest.java file, containing a few test cases. While nothing fancy, this will be enough to perform a simple analysis for the workshop.

```java
public class CalculatorTest {

	@Test
	public void testSum() {
		// Given
		Calculator calculator = new Calculator();
		// When
		int result = calculator.sum(2, 2);
		// Then
		if (result != 4) {   // if 2 + 2 != 4
			Assert.fail();
		}
	}
    ...
```

#### Inspecting the Maven Test Report

Run `mvn test`. You should see maven download dependencies and print out the test results. You can inspect the resulting files produced by the surefire plugin, in `target/superfire-reports/`, which includes a xml file containing the following:

```xml
  <testcase classname="com.github.stokito.unitTestExample.calculator.CalculatorTest" name="testSum" time="0.015"/>
  <testcase classname="com.github.stokito.unitTestExample.calculator.CalculatorTest" name="testFlaky" time="7.347"/>
  <testcase classname="com.github.stokito.unitTestExample.calculator.CalculatorTest" name="testMinus" time="0.016">
    <failure message="expected:&lt;0&gt; but was:&lt;4&gt;" type="junit.framework.AssertionFailedError">junit.framework.AssertionFailedError: expected:&lt;0&gt; but was:&lt;4&gt;
	at junit.framework.Assert.fail(Assert.java:57)
	at junit.framework.Assert.failNotEquals(Assert.java:329)
	at junit.framework.Assert.assertEquals(Assert.java:78)
	at junit.framework.Assert.assertEquals(Assert.java:234)
	at junit.framework.Assert.assertEquals(Assert.java:241)
	at com.github.stokito.unitTestExample.calculator.CalculatorTest.testMinus(CalculatorTest.java:45)
```

#### Inspecting the Driver Code

For the workshop, we will be running `mvn test` and then parsing the xml file to retrieve the test results. Luckily, we have code that already helps do this initial step, providing a simple JSON representation of the test results.

```js
let mvn = child.exec('mvn test', {cwd: testsuite_dir});
mvn.stdout.pipe( process.stdout );
mvn.stderr.pipe( process.stderr );

mvn.once('exit', async (exitCode) => 
{
	let testReport = getTestReport(testsuite_dir);
	let tests = await getTestResults(testReport);
	tests.forEach( e => console.log(e));
});
```

``` | {type: 'terminal'}
```

Stepping one directory back up from the simplecalc directory, and run `npm install` in the top-level directory. Then run:

```bash
node index.js priority simplecalc
```

You should see the printout of the `mvn test` results:

```json
{ name: 'testSum', time: '0.004', status: 'passed' }
{ name: 'testSlow', time: '0.007', status: 'passed' }
{ name: 'testFlaky', time: '10.715', status: 'passed' }
{ name: 'testMinus', time: '0.005', status: 'failed' }
{ name: 'testDivide', time: '0', status: 'passed' }
{ name: 'testDivideWillThrowExceptionWhenDivideOnZero',
  time: '0.001',
  status: 'passed' }
```





## Tasks

For the workshop, we will perform two tasks: 

1. **Simple test case analysis:** Extend the code (`lib/driver.js`) to support the analysis of the test suite. Using status and execution time of tests, sort, and print out list of most effective tests: (ones that fail, followed those that run the fastest). When this data is collected historically, it can be useful for pruning or prioritizing unit tests in a test suite.

``` | {type: 'terminal'}
```

2. **Flaky test detection:** One of the tests is flaky. See if you can write code that will help automatically detect it.
But before that, let's make sure we know how to calculate flaky tests...

### Calculating the flaky score?

Examine the following results of 4 repeated runs of a test suite with 4 tests.

| Run # | test A (P) | test B (F)  | test C (P) | test D (F) |
| ----- | -----    | -----   | ------ | ------ | 
| 1     | passed   | failed  | passed | passed |
| 2     | passed   | failed  | passed | failed |
| 3     | passed   | failed  | failed | failed |
| 4     | passed   | failed  | failed | failed |

1. What is the flakyness score for test A?

```js|{type:'quiz', quiz_type:'singlechoice', quiz_answers:'2'}
- [ ] 100%
- [ ] 50%
- [ ] 0%
```

2. What is the failure rate for test B?

```js|{type:'quiz', quiz_type:'singlechoice', quiz_answers:'0'}
- [ ] 100%
- [ ] 50%
- [ ] 0%
```

3. What is the flakyness score for test C?

```js|{type:'quiz', quiz_type:'singlechoice', quiz_answers:'1'}
- [ ] 100%
- [ ] 50%
- [ ] 0%
```

4. What is the flakyness score for test D?

```js|{type:'quiz', quiz_type:'singlechoice', quiz_answers:'2'}
- [ ] 75%
- [ ] 50%
- [ ] 25%
```

5. Which of the following would be the correct formula for calculating flakyness of a test case?

```js|{type:'quiz', quiz_type:'singlechoice', quiz_answers:'1'}
- [ ] `failing / (passing + failing)`
- [ ] `min(passing,failing) / (passing + failing)`
- [ ] `max(passing,failing) / (passing)`
```

### Implementing Flaky Tests Analysis

Extend the code to run `mvn test` several times (10--20), and each run, collect statistics about failing and passing tests. Based on the rate of failing and passing tests, calculate a "flakyness" score for each test case, using the correct formula from above. Print the test and score.

``` | {type: 'terminal'}
```
