/// <reference path="../../src/utils/logging.ts" />
/// <reference path="../testCommon.ts" />

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
    app.utils.Logger.log("dummyData");
    sinon.assert.calledOnce(consoleLogStub);
});