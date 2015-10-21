/// <reference path="./testCommon.ts" />

import barSrc = require("../src/bar");
import fooSrc = require("../src/foo");

type IBar = barSrc.IBar;

var sandbox: SinonSandbox,
    bar: IBar;

//QUnit.start();

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
    var foo = new fooSrc.Foo(bar);
    ok(foo != null, "foo was initialized");
});

test("dummy collaboration test", () => {
    var doAdditionalWorkSpy = sinon.spy(bar, "doAdditionalWork");

    var foo = new fooSrc.Foo(bar);
    foo.doWork("dummyData");

    sinon.assert.calledWith(doAdditionalWorkSpy, "dummyData");
});