import { Component, Input } from '@angular/core';

@Component({
  selector: 'bofa-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class BofaCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
