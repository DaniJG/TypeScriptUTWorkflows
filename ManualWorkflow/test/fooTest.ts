/// <reference path="../src/foo.ts" />
/// <reference path="./testCommon.ts" />

var sandbox: SinonSandbox,
    bar: app.IBar;

QUnit.module("fooTests", {
    setup: () => {
        sandbox = sinon.sandbox.create();

        bar = {
            doAdditionalWork: (data: string) => { }
        };
    },
    teardown: () => {
        sandbox.restore();
    }
});

test("dummy test", () => {
    var foo = new app.Foo(bar);
    ok(foo != null, "foo was initialized");
});

test("dummy collaboration test", () => {
    var doAdditionalWorkSpy = sinon.spy(bar, "doAdditionalWork");

    var foo = new app.Foo(bar);
    foo.doWork("dummyData");

    sinon.assert.calledWith(doAdditionalWorkSpy, "dummyData");
});