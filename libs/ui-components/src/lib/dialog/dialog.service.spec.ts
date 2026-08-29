import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { BofaDialogService } from './dialog.service';

describe('BofaDialogService', () => {
  function serviceWithDialogResult(result: unknown): BofaDialogService {
    const dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(result) } as never);
    return new BofaDialogService(dialogSpy);
  }

  it('maps a confirmed close to true', (done) => {
    serviceWithDialogResult(true)
      .confirm({ title: 'T', message: 'M' })
      .subscribe((confirmed) => {
        expect(confirmed).toBeTrue();
        done();
      });
  });

  it('maps a dismissed dialog (undefined) to false', (done) => {
    serviceWithDialogResult(undefined)
      .confirm({ title: 'T', message: 'M' })
      .subscribe((confirmed) => {
        expect(confirmed).toBeFalse();
        done();
      });
  });
});
