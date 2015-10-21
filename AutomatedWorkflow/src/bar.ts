module app {

    export interface IBar{
        doAdditionalWork(data: string): void
    }

    export class Bar implements IBar {

        public Bar() {
        }

        public doAdditionalWork(data: string): void {
            
        }
    }

}