import * as i0 from "@angular/core";
export interface BofaTableColumn {
    key: string;
    header: string;
    align?: 'left' | 'right';
}
export declare class BofaTableComponent {
    columns: BofaTableColumn[];
    data: Record<string, unknown>[];
    get columnKeys(): string[];
    static ɵfac: i0.ɵɵFactoryDeclaration<BofaTableComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<BofaTableComponent, "bofa-table", never, { "columns": "columns"; "data": "data"; }, {}, never, never, false>;
}
