/// <reference path="./bar.ts" />

module app {

    export class Foo {
        constructor(private bar: IBar) {
        }

        public doWork(data: string) {
            this.bar.doAdditionalWork(data);
        }
    }

}