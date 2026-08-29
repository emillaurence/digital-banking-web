import { Component, Input } from '@angular/core';

export type BofaButtonVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'bofa-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class BofaButtonComponent {
  @Input() variant: BofaButtonVariant = 'primary';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
}
