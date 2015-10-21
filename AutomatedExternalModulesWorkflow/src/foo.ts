import bar = require("./bar");
type IBar = bar.IBar;

export class Foo {
    constructor(private bar: IBar) {
    }

    public doWork(data: string) {
        this.bar.doAdditionalWork(data);
    }
}
