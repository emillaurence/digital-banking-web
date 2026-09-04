import { TestBed } from '@angular/core/testing';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { BofaButtonComponent } from './button.component';

describe('BofaButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonModule],
      declarations: [BofaButtonComponent],
    }).compileComponents();
  });

  it('renders a Material flat button with the variant class', () => {
    const fixture = TestBed.createComponent(BofaButtonComponent);
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-flat-button');
    expect(button.classList).toContain('bofa-button--secondary');
  });

  it('disables the native button', () => {
    const fixture = TestBed.createComponent(BofaButtonComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTrue();
  });
});
