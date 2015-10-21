/// <reference path="../testCommon.ts" />

import loggingSrc = require("../../src/utils/logging");

var sandbox: SinonSandbox,
    consoleLogStub: SinonStub;

QUnit.module("fooTests", {
    setup: () => {
        sandbox = sinon.sandbox.create();

        consoleLogStub = sandbox.stub(console, "log");
    },
    teardown: () => {
        sandbox.restore();
    }
});

test("Logger.log calls console.log", () => {
    loggingSrc.Logger.log("dummyData");
    sinon.assert.calledOnce(consoleLogStub);
});